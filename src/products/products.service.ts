import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'

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

  async findOne(id: string) {
    try {
      this.logger.log(`Buscando producto con ID: ${id}`)
      const product = await this.prisma.product.findUnique({
        where: { id },
      })
      
      if (!product) {
        this.logger.warn(`Producto con ID ${id} no encontrado`)
        throw new NotFoundException(`Producto con ID ${id} no encontrado`)
      }
      
      this.logger.log(`Producto encontrado: ${product.name}`)
      return product
    } catch (error) {
      this.logger.error('Error al obtener producto:', error)
      throw error
    }
  }

  async decreaseStock(productId: string, quantity: number) {
    try {
      this.logger.log(`Descontando ${quantity} unidades del producto ${productId}`)
      
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      })

      if (!product) {
        throw new NotFoundException(`Producto con ID ${productId} no encontrado`)
      }

      if (!product.active) {
        throw new BadRequestException(`El producto ${product.name} no está activo`)
      }

      if (product.stock < quantity) {
        throw new BadRequestException(
          `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${quantity}`
        )
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id: productId },
        data: {
          stock: {
            decrement: quantity,
          },
        },
      })

      this.logger.log(`Stock actualizado: ${product.name} - Stock anterior: ${product.stock}, Stock nuevo: ${updatedProduct.stock}`)
      return updatedProduct
    } catch (error) {
      this.logger.error(`Error al descontar stock del producto ${productId}:`, error)
      throw error
    }
  }

  async create(dto: CreateProductDto) {
    try {
      this.logger.log(`Creando producto: ${dto.name}`)
      const product = await this.prisma.product.create({
        data: {
          name: dto.name,
          description: dto.description,
          priceCLP: dto.priceCLP,
          stock: dto.stock,
          imageUrl: dto.imageUrl,
          active: dto.active !== undefined ? dto.active : true,
        },
      })
      this.logger.log(`Producto creado: ${product.name}`)
      return product
    } catch (error) {
      this.logger.error('Error al crear producto:', error)
      throw error
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    try {
      this.logger.log(`Actualizando producto con ID: ${id}`)
      
      const product = await this.findOne(id)

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.priceCLP !== undefined && { priceCLP: dto.priceCLP }),
          ...(dto.stock !== undefined && { stock: dto.stock }),
          ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
          ...(dto.active !== undefined && { active: dto.active }),
        },
      })

      this.logger.log(`Producto actualizado: ${updatedProduct.name}`)
      return updatedProduct
    } catch (error) {
      this.logger.error(`Error al actualizar producto ${id}:`, error)
      throw error
    }
  }

  async remove(id: string) {
    try {
      this.logger.log(`Eliminando producto con ID: ${id}`)
      
      const product = await this.findOne(id)

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          active: false,
        },
      })

      this.logger.log(`Producto desactivado: ${updatedProduct.name}`)
      return updatedProduct
    } catch (error) {
      this.logger.error(`Error al eliminar producto ${id}:`, error)
      throw error
    }
  }
}
