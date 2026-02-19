import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ProductsService } from '../products/products.service'
import { AdjustStockDto } from './dto/adjust-stock.dto'
import { InventoryMovementType } from '@prisma/client'

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

  async getInventoryMovements(productId?: string) {
    const where = productId ? { productId } : {}

    const movements = await this.prisma.inventoryMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limitar a los últimos 100 movimientos
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
