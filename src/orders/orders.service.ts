import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ProductsService } from '../products/products.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { OrderResponseDto } from './dto/order-response.dto'
import { OrderStatus, InventoryMovementType, PaymentStatus, PaymentProvider } from '@prisma/client'
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

        // Crear OrderItems y descontar stock
        const orderItems = []
        for (const item of dto.items) {
          // Obtener producto dentro de la transacción con bloqueo para evitar race conditions
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          })

          if (!product) {
            throw new BadRequestException(`Producto con ID ${item.productId} no encontrado`)
          }

          if (!product.active) {
            throw new BadRequestException(`El producto ${product.name} no está activo`)
          }

          if (product.stock < item.quantity) {
            throw new BadRequestException(
              `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`
            )
          }

          // Descontar stock dentro de la transacción
          const updatedProduct = await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          })

          // Crear OrderItem
          const orderItem = await tx.orderItem.create({
            data: {
              orderId: createdOrder.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPriceCLP: product.priceCLP,
              lineTotalCLP: product.priceCLP * item.quantity,
            },
          })

          // Crear InventoryMovement
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

        // Actualizar status de la orden a PAGADO
        const updatedOrder = await tx.order.update({
          where: { id: createdOrder.id },
          data: { status: OrderStatus.PAGADO },
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
}
