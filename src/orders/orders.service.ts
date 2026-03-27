import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ProductsService } from '../products/products.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { OrderResponseDto } from './dto/order-response.dto'
import { InternalOrderResponseDto } from './dto/internal-order-response.dto'
import {
  OrderStatus,
  InventoryMovementType,
  PaymentStatus,
  PaymentProvider,
  FulfillmentType,
} from '../generated/prisma/client'
import { randomBytes } from 'crypto'

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name)

  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<OrderResponseDto> {
    this.logger.log(`Creando orden para cliente: ${dto.customerName}`)

    // Validar que todos los productos existan y tengan stock suficiente
    await this.validateOrderItems(dto.items)

    // Generar token público único
    const publicToken = this.generatePublicToken()

    // Calcular total
    const totalCLP = await this.calculateTotal(dto.items)

    try {
      // Usar transacción para asegurar atomicidad
      const order = await this.prisma.$transaction(async (tx) => {
        // Crear Order
        const createdOrder = await tx.order.create({
          data: {
            customerName: dto.customerName,
            customerEmail: dto.customerEmail,
            customerPhone: dto.customerPhone,
            fulfillmentType: dto.fulfillmentType,
            deliveryAddress: dto.deliveryAddress,
            zone: dto.zone,
            totalCLP,
            status: OrderStatus.CREADO,
            publicToken,
          },
        })

        // Crear OrderItems y descontar stock (UPDATE atómico para evitar race conditions)
        const orderItems = []
        for (const item of dto.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          })

          if (!product) {
            throw new BadRequestException(`Producto con ID ${item.productId} no encontrado`)
          }

          if (!product.active) {
            throw new BadRequestException(`El producto ${product.name} no está activo`)
          }

          // UPDATE atómico: solo descontar si hay stock suficiente (evita stock negativo con concurrencia)
          const updated = await tx.$queryRaw<Array<{ id: string; name: string; priceCLP: number }>>`
            UPDATE "Product"
            SET stock = stock - ${item.quantity}
            WHERE id = ${item.productId}
              AND stock >= ${item.quantity}
            RETURNING id, name, "priceCLP"
          `

          if (!updated || updated.length === 0) {
            const current = await tx.product.findUnique({
              where: { id: item.productId },
              select: { name: true, stock: true },
            })
            throw new BadRequestException(
              current
                ? `Stock insuficiente para ${current.name}. Disponible: ${current.stock}, Solicitado: ${item.quantity}`
                : `Producto con ID ${item.productId} no encontrado`
            )
          }

          const productAfterUpdate = updated[0]

          const orderItem = await tx.orderItem.create({
            data: {
              orderId: createdOrder.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPriceCLP: productAfterUpdate.priceCLP,
              lineTotalCLP: productAfterUpdate.priceCLP * item.quantity,
            },
          })

          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              type: InventoryMovementType.OUT,
              quantity: item.quantity,
              reason: `Venta - Orden ${createdOrder.id}`,
            },
          })

          orderItems.push(orderItem)
        }

        // Crear Payment (simulado por ahora)
        await tx.payment.create({
          data: {
            orderId: createdOrder.id,
            provider: PaymentProvider.MOCK,
            status: PaymentStatus.PAID,
            amountCLP: totalCLP,
          },
        })

        // Pedido confirmado: entra al flujo operativo como EN_PREPARACION (despacho)
        const updatedOrder = await tx.order.update({
          where: { id: createdOrder.id },
          data: { status: OrderStatus.EN_PREPARACION },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        })

        return updatedOrder
      })

      this.logger.log(`Orden creada exitosamente: ${order.id}`)

      // Mapear a DTO de respuesta
      return {
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        fulfillmentType: order.fulfillmentType,
        deliveryAddress: order.deliveryAddress,
        zone: order.zone,
        totalCLP: order.totalCLP,
        status: order.status,
        publicToken: order.publicToken,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPriceCLP: item.unitPriceCLP,
          lineTotalCLP: item.lineTotalCLP,
          createdAt: item.createdAt,
        })),
      }
    } catch (error) {
      this.logger.error('Error al crear orden:', error)
      throw error
    }
  }

  private async validateOrderItems(items: Array<{ productId: string; quantity: number }>) {
    for (const item of items) {
      if (item.quantity <= 0) {
        throw new BadRequestException(`La cantidad debe ser mayor a 0 para el producto ${item.productId}`)
      }

      const product = await this.productsService.findOne(item.productId)

      if (!product.active) {
        throw new BadRequestException(`El producto ${product.name} no está activo`)
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`
        )
      }
    }
  }

  private async calculateTotal(items: Array<{ productId: string; quantity: number }>): Promise<number> {
    let total = 0

    for (const item of items) {
      const product = await this.productsService.findOne(item.productId)
      total += product.priceCLP * item.quantity
    }

    return total
  }

  private generatePublicToken(): string {
    return randomBytes(16).toString('hex')
  }

  /** Solo estados del flujo operativo de despacho; PAGADO no se usa en el panel. */
  private readonly internalStatuses: OrderStatus[] = [
    OrderStatus.EN_PREPARACION,
    OrderStatus.LISTO,
    OrderStatus.ENTREGADO,
    OrderStatus.RETIRADO,
    OrderStatus.CANCELADO,
  ]

  async getInternalOrders(): Promise<InternalOrderResponseDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { status: { in: this.internalStatuses } },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    })
    return orders.map((order) => ({
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      fulfillmentType: order.fulfillmentType,
      deliveryAddress: order.deliveryAddress,
      zone: order.zone,
      totalCLP: order.totalCLP,
      status: order.status,
      publicToken: order.publicToken,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPriceCLP: item.unitPriceCLP,
        lineTotalCLP: item.lineTotalCLP,
      })),
    }))
  }

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    userRole: string,
  ): Promise<InternalOrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    })
    if (!order) {
      throw new NotFoundException(`Orden con ID ${orderId} no encontrada`)
    }

    const currentStatus = order.status

    if (userRole === 'DESPACHO') {
      const isPreparingToReady =
        currentStatus === OrderStatus.EN_PREPARACION && newStatus === OrderStatus.LISTO
      const isListoToDelivered =
        currentStatus === OrderStatus.LISTO &&
        newStatus === OrderStatus.ENTREGADO &&
        order.fulfillmentType === FulfillmentType.DELIVERY
      const isListoToRetired =
        currentStatus === OrderStatus.LISTO &&
        newStatus === OrderStatus.RETIRADO &&
        order.fulfillmentType === FulfillmentType.PICKUP

      if (!isPreparingToReady && !isListoToDelivered && !isListoToRetired) {
        throw new BadRequestException(
          `Transición de ${currentStatus} a ${newStatus} no permitida para despacho. Flujo válido: EN_PREPARACION -> LISTO; LISTO -> ENTREGADO (delivery) o RETIRADO (pickup).`,
        )
      }
    } else if (userRole === 'PRODUCCION' || userRole === 'SUPER_ADMIN') {
      const allowedTransitions: [OrderStatus, OrderStatus][] = [
        [OrderStatus.PAGADO, OrderStatus.EN_PREPARACION],
        [OrderStatus.EN_PREPARACION, OrderStatus.LISTO],
        [OrderStatus.LISTO, OrderStatus.ENTREGADO],
        [OrderStatus.LISTO, OrderStatus.RETIRADO],
      ]
      const allowed = allowedTransitions.some(
        ([from, to]) => from === currentStatus && to === newStatus,
      )
      if (!allowed) {
        throw new BadRequestException(
          `Transición de ${currentStatus} a ${newStatus} no permitida`,
        )
      }
      if (currentStatus === OrderStatus.LISTO && order.fulfillmentType === FulfillmentType.PICKUP && newStatus !== OrderStatus.RETIRADO) {
        throw new BadRequestException('Para retiro en tienda use estado RETIRADO')
      }
      if (currentStatus === OrderStatus.LISTO && order.fulfillmentType === FulfillmentType.DELIVERY && newStatus !== OrderStatus.ENTREGADO) {
        throw new BadRequestException('Para delivery use estado ENTREGADO')
      }
    } else {
      throw new BadRequestException('Rol sin permiso para cambiar estado del pedido')
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    })

    return {
      id: updated.id,
      customerName: updated.customerName,
      customerEmail: updated.customerEmail,
      customerPhone: updated.customerPhone,
      fulfillmentType: updated.fulfillmentType,
      deliveryAddress: updated.deliveryAddress,
      zone: updated.zone,
      totalCLP: updated.totalCLP,
      status: updated.status,
      publicToken: updated.publicToken,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      items: updated.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPriceCLP: item.unitPriceCLP,
        lineTotalCLP: item.lineTotalCLP,
      })),
    }
  }
}
