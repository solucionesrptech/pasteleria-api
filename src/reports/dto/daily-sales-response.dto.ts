import { ApiProperty } from '@nestjs/swagger'

export class DailySalesSummaryDto {
  @ApiProperty({ description: 'Total vendido hoy en CLP' })
  totalSalesCLP: number

  @ApiProperty({ description: 'Cantidad de pedidos pagados hoy' })
  paidOrdersCount: number

  @ApiProperty({ description: 'Total de unidades vendidas hoy' })
  unitsSold: number
}

export class DailySalesProductDto {
  @ApiProperty()
  productId: string

  @ApiProperty()
  productName: string

  @ApiProperty()
  quantitySold: number

  @ApiProperty()
  totalSalesCLP: number
}

export class DailySalesResponseDto {
  @ApiProperty({ type: DailySalesSummaryDto })
  summary: DailySalesSummaryDto

  @ApiProperty({ type: [DailySalesProductDto] })
  products: DailySalesProductDto[]
}
