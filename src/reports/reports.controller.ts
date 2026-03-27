import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { QuerySalesReportDto } from './dto/query-sales-report.dto'
import { SalesReportResponseDto } from './dto/sales-report-response.dto'
import { ReportsService } from './reports.service'

@Controller('reports')
@ApiTags('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMINISTRADOR', 'JEFE_VENTAS')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reporte de ventas por rango (daily, weekly, monthly)' })
  @ApiResponse({ status: 200, description: 'Resumen y detalle por producto', type: SalesReportResponseDto })
  @ApiResponse({ status: 400, description: 'Rango no implementado o no válido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async getSalesReport(@Query() query: QuerySalesReportDto): Promise<SalesReportResponseDto> {
    const range = query.range ?? 'monthly'
    return this.reportsService.getSalesReport(range)
  }
}
