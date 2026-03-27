import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class LossSummaryDto {
  @ApiProperty({ description: 'Total de unidades perdidas por merma' })
  totalUnitsLost: number

  @ApiProperty({ description: 'Cantidad de registros de merma' })
  count: number

  @ApiProperty({ description: 'Costo estimado de merma (suma quantity * priceCLP)' })
  estimatedCostCLP: number
}

export class LossItemDto {
  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  productId: string

  @ApiProperty()
  productName: string

  @ApiProperty()
  quantity: number

  @ApiPropertyOptional()
  reason: string | null

  @ApiPropertyOptional()
  userId: string | null

  @ApiPropertyOptional({ description: 'Email del usuario que registró la merma' })
  userEmail: string | null

  @ApiProperty({ description: 'Costo estimado de esta línea (quantity * priceCLP)' })
  estimatedCostCLP: number
}

export class SalesReportSummaryDto {
  @ApiProperty({ description: 'Total vendido en CLP' })
  totalSalesCLP: number

  @ApiProperty({ description: 'Cantidad de pedidos pagados' })
  paidOrdersCount: number

  @ApiProperty({ description: 'Total de unidades vendidas' })
  unitsSold: number
}

export class SalesReportProductDto {
  @ApiProperty()
  productId: string

  @ApiProperty()
  productName: string

  @ApiProperty()
  quantitySold: number

  @ApiProperty()
  totalSalesCLP: number
}

export class SalesReportResponseDto {
  @ApiProperty({ description: 'Rango aplicado', example: 'monthly' })
  range: string

  @ApiProperty({ type: SalesReportSummaryDto })
  summary: SalesReportSummaryDto

  @ApiProperty({ type: [SalesReportProductDto] })
  products: SalesReportProductDto[]

  @ApiPropertyOptional({ type: LossSummaryDto, description: 'Métricas de merma del período' })
  lossSummary?: LossSummaryDto

  @ApiPropertyOptional({ type: [LossItemDto], description: 'Listado de mermas del período' })
  losses?: LossItemDto[]
}
