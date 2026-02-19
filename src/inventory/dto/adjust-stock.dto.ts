import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator'

export class AdjustStockDto {
  @IsString()
  @IsNotEmpty({ message: 'El ID del producto es requerido' })
  productId: string

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(-1000, { message: 'La cantidad no puede ser menor a -1000' })
  quantity: number

  @IsOptional()
  @IsString()
  reason?: string
}
