import { Controller, Post, Body, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { OrderResponseDto } from './dto/order-response.dto'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name)

  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva orden' })
  @ApiResponse({ status: 201, description: 'Orden creada exitosamente', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos o stock insuficiente' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    try {
      this.logger.log(`Recibida solicitud de creación de orden para: ${createOrderDto.customerName}`)
      const order = await this.ordersService.createOrder(createOrderDto)
      this.logger.log(`Orden creada exitosamente: ${order.id}`)
      return order
    } catch (error) {
      this.logger.error('Error en OrdersController.createOrder:', error)
      
      if (error instanceof HttpException) {
        throw error
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error al crear la orden',
          error: error.message || 'Error desconocido',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
