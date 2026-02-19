import { Controller, Get, Post, Put, Delete, Param, Body, HttpException, HttpStatus, NotFoundException, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { ProductsService } from './products.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('products')
@ApiTags('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos activos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos activos',
  })
  async findAll() {
    try {
      return await this.productsService.findAll()
    } catch (error) {
      console.error('Error en ProductsController.findAll:', error)
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error al obtener productos',
          error: error.message || 'Error desconocido',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
  })
  async findOne(@Param('id') id: string) {
    try {
      return await this.productsService.findOne(id)
    } catch (error) {
      if (error.message.includes('no encontrado')) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`)
      }
      console.error('Error en ProductsController.findOne:', error)
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error al obtener producto',
          error: error.message || 'Error desconocido',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRODUCCION', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async create(@Body() createProductDto: CreateProductDto) {
    try {
      return await this.productsService.create(createProductDto)
    } catch (error) {
      console.error('Error en ProductsController.create:', error)
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error al crear producto',
          error: error.message || 'Error desconocido',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRODUCCION', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiResponse({ status: 200, description: 'Producto actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    try {
      return await this.productsService.update(id, updateProductDto)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      console.error('Error en ProductsController.update:', error)
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error al actualizar producto',
          error: error.message || 'Error desconocido',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRODUCCION', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un producto (soft delete)' })
  @ApiResponse({ status: 200, description: 'Producto eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async remove(@Param('id') id: string) {
    try {
      return await this.productsService.remove(id)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      console.error('Error en ProductsController.remove:', error)
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error al eliminar producto',
          error: error.message || 'Error desconocido',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}

