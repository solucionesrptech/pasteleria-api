import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ProductsService } from '../products/products.service'
import { AdjustStockDto } from './dto/adjust-stock.dto'
import { RegisterLossDto } from './dto/register-loss.dto'
import { InventoryMovementType } from '../generated/prisma/client'

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name)

  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

  async adjustStock(dto: AdjustStockDto, userId: string) {
    this.logger.log(`Ajustando stock del producto ${dto.productId}: ${dto.quantity > 0 ? '+' : ''}${dto.quantity}`)

    if (dto.quantity === 0) {
      throw new BadRequestException('La cantidad no puede ser 0')
    }

    const product = await this.productsService.findOne(dto.productId)

    if (!product.active) {
      throw new BadRequestException(`El producto ${product.name} no está activo`)
    }

    const newStock = product.stock + dto.quantity

    if (newStock < 0) {
      throw new BadRequestException(
        `No se puede descontar ${Math.abs(dto.quantity)} unidades. Stock actual: ${product.stock}`
      )
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id: dto.productId },
      data: {
        stock: newStock,
      },
    })

    await this.prisma.inventoryMovement.create({
      data: {
        productId: dto.productId,
        type: InventoryMovementType.ADJUST,
        quantity: dto.quantity,
        reason: dto.reason || `Ajuste manual por usuario ${userId}`,
        userId,
      },
    })

    this.logger.log(`Stock actualizado: ${product.name} - Stock anterior: ${product.stock}, Stock nuevo: ${updatedProduct.stock}`)

    return updatedProduct
  }

  async registerLoss(dto: RegisterLossDto, userId: string) {
    this.logger.log(`Registrando merma del producto ${dto.productId}: ${dto.quantity} - ${dto.reason}`)

    if (dto.quantity <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0')
    }

    const product = await this.productsService.findOne(dto.productId)

    if (!product.active) {
      throw new BadRequestException(`El producto ${product.name} no está activo`)
    }

    if (product.stock < dto.quantity) {
      throw new BadRequestException(
        `Stock insuficiente para registrar merma. Disponible: ${product.stock}, solicitado: ${dto.quantity}`,
      )
    }

    const newStock = product.stock - dto.quantity

    const updatedProduct = await this.prisma.product.update({
      where: { id: dto.productId },
      data: {
        stock: newStock,
      },
    })

    await this.prisma.inventoryMovement.create({
      data: {
        productId: dto.productId,
        type: InventoryMovementType.LOSS,
        quantity: dto.quantity,
        reason: dto.reason?.trim() || null,
        userId,
      },
    })

    this.logger.log(`Merma registrada: ${product.name} - Stock anterior: ${product.stock}, Stock nuevo: ${updatedProduct.stock}`)

    return updatedProduct
  }

  private static readonly VALID_MOVEMENT_TYPES: InventoryMovementType[] = [
    'IN',
    'OUT',
    'ADJUST',
    'LOSS',
  ]

  async getInventoryMovements(
    productId?: string,
    type?: InventoryMovementType,
    dateFrom?: Date,
    dateTo?: Date,
  ) {
    const where: { productId?: string; type?: InventoryMovementType; createdAt?: { gte?: Date; lte?: Date } } = {}
    if (productId) where.productId = productId
    const normalizedType = type?.toUpperCase?.() as InventoryMovementType | undefined
    if (normalizedType && InventoryService.VALID_MOVEMENT_TYPES.includes(normalizedType)) {
      where.type = normalizedType
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = dateFrom
      if (dateTo) where.createdAt.lte = dateTo
    }

    const movements = await this.prisma.inventoryMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    })

    return movements
  }

  async getLowStockProducts(threshold: number = 5) {
    const products = await this.prisma.product.findMany({
      where: {
        active: true,
        stock: {
          lte: threshold,
        },
      },
      orderBy: {
        stock: 'asc',
      },
    })

    return products
  }
}
