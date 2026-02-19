import { Controller, Post, Body, Get, Query, UseGuards, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { InventoryService } from './inventory.service'
import { AdjustStockDto } from './dto/adjust-stock.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name)

  constructor(private readonly inventoryService: InventoryService) {}

  @Post('adjust')
  @Roles('PRODUCCION', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Ajustar stock de un producto' })
  @ApiResponse({ status: 200, description: 'Stock ajustado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o stock insuficiente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async adjustStock(
    @Body() adjustStockDto: AdjustStockDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    try {
      this.logger.log(`Usuario ${user.email} ajustando stock del producto ${adjustStockDto.productId}`)
      return await this.inventoryService.adjustStock(adjustStockDto, user.id)
    } catch (error) {
      this.logger.error('Error en InventoryController.adjustStock:', error)
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error al ajustar stock',
          error: error.message || 'Error desconocido',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('movements')
  @Roles('PRODUCCION', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Obtener historial de movimientos de inventario' })
  @ApiResponse({ status: 200, description: 'Historial de movimientos' })
  async getInventoryMovements(@Query('productId') productId?: string) {
    try {
      return await this.inventoryService.getInventoryMovements(productId)
    } catch (error) {
      this.logger.error('Error en InventoryController.getInventoryMovements:', error)
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error al obtener movimientos',
          error: error.message || 'Error desconocido',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('low-stock')
  @Roles('PRODUCCION', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Obtener productos con stock bajo' })
  @ApiResponse({ status: 200, description: 'Productos con stock bajo' })
  async getLowStockProducts(@Query('threshold') threshold?: string) {
    try {
      const thresholdNumber = threshold ? parseInt(threshold, 10) : 5
      return await this.inventoryService.getLowStockProducts(thresholdNumber)
    } catch (error) {
      this.logger.error('Error en InventoryController.getLowStockProducts:', error)
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error al obtener productos con stock bajo',
          error: error.message || 'Error desconocido',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
