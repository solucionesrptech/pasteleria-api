import { IsString, IsNotEmpty, IsInt, IsOptional, IsBoolean, Min } from 'class-validator'

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es requerido' })
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsInt({ message: 'El precio debe ser un número entero' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  priceCLP: number

  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock: number

  @IsOptional()
  @IsString()
  imageUrl?: string

  @IsOptional()
  @IsBoolean()
  active?: boolean
}
