import { IsString, IsNotEmpty, IsInt, Min, MinLength } from 'class-validator'

export class RegisterLossDto {
  @IsString()
  @IsNotEmpty({ message: 'El ID del producto es requerido' })
  productId: string

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  quantity: number

  @IsString()
  @IsNotEmpty({ message: 'El motivo de la merma es requerido' })
  @MinLength(1, { message: 'El motivo no puede estar vacío' })
  reason: string
}
