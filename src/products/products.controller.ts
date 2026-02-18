import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { ProductsService } from './products.service'
import { ProductResponseDto } from './dto/product-response.dto'

@Controller('products')
@ApiTags('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos activos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos activos',
    type: [ProductResponseDto],
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
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
}

