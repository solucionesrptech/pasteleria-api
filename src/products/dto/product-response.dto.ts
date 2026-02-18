import { ApiProperty } from '@nestjs/swagger'

export class ProductResponseDto {
  @ApiProperty({ description: 'ID único del producto', example: 'clx1234567890' })
  id: string

  @ApiProperty({ description: 'Nombre del producto', example: 'Torta de Chocolate' })
  name: string

  @ApiProperty({ description: 'Descripción del producto', example: 'Deliciosa torta de chocolate con crema', required: false, nullable: true })
  description: string | null

  @ApiProperty({ description: 'Precio en CLP (IVA incluido)', example: 15990 })
  priceCLP: number

  @ApiProperty({ description: 'URL de la imagen del producto', required: false, nullable: true })
  imageUrl: string | null

  @ApiProperty({ description: 'Indica si el producto está activo', example: true })
  active: boolean

  @ApiProperty({ description: 'Stock disponible', example: 10 })
  stock: number

  @ApiProperty({ description: 'Fecha de creación', example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date

  @ApiProperty({ description: 'Fecha de última actualización', example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date
}
