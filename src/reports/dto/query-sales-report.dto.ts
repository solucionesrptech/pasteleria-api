import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional } from 'class-validator'

export type SalesReportRange = 'daily' | 'weekly' | 'monthly'

export const SALES_REPORT_RANGES: SalesReportRange[] = ['daily', 'weekly', 'monthly']

export class QuerySalesReportDto {
  @ApiPropertyOptional({
    description: 'Rango del reporte',
    enum: SALES_REPORT_RANGES,
    default: 'monthly',
  })
  @IsOptional()
  @IsIn(SALES_REPORT_RANGES)
  range?: SalesReportRange
}
