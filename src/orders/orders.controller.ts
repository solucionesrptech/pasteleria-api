import { Controller, Post, Body, Get, Patch, Param, UseGuards, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderStatusDto } from './dto/update-order-status.dto'
import { OrderResponseDto } from './dto/order-response.dto'
import { InternalOrderResponseDto } from './dto/internal-order-response.dto'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name)

  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Crear una nueva orden' })
  @ApiResponse({ status: 201, description: 'Orden creada exitosamente', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos o stock insuficiente' })
  @ApiResponse({ status: 429, description: 'Demasiadas solicitudes; intenta más tarde' })
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

  @Get('internal')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DESPACHO', 'PRODUCCION', 'SUPER_ADMIN', 'RECEPCION')
  @ApiOperation({ summary: 'Listar pedidos para flujo interno (cocina/despacho)' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos internos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async getInternalOrders(): Promise<InternalOrderResponseDto[]> {
    try {
      return this.ordersService.getInternalOrders()
    } catch (error) {
      this.logger.error('Error en OrdersController.getInternalOrders:', error)
      if (error instanceof HttpException) throw error
      throw new HttpException(
        { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Error al obtener pedidos internos' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DESPACHO', 'PRODUCCION', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Actualizar estado de un pedido' })
  @ApiResponse({ status: 200, description: 'Estado actualizado', type: InternalOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Transición no permitida' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ): Promise<InternalOrderResponseDto> {
    try {
      return this.ordersService.updateOrderStatus(id, dto.status, user.role)
    } catch (error) {
      this.logger.error('Error en OrdersController.updateOrderStatus:', error)
      if (error instanceof HttpException) throw error
      throw new HttpException(
        { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Error al actualizar estado' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
