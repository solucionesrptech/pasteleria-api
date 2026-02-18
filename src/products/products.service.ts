import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name)

  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      this.logger.log('Buscando productos activos...')
      const products = await this.prisma.product.findMany({
        where: {
          active: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      this.logger.log(`Encontrados ${products.length} productos`)
      return products
    } catch (error) {
      this.logger.error('Error al obtener productos:', error)
      throw error
    }
  }
}
