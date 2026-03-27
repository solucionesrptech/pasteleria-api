import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  Max,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator'
import { Type } from 'class-transformer'

export enum FulfillmentType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
}

class OrderItemDto {
  @IsString()
  productId: string

  @IsInt()
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  @Max(999, { message: 'La cantidad por línea no puede superar 999' })
  quantity: number
}

export class CreateOrderDto {
  @IsString()
  @MaxLength(200, { message: 'El nombre no puede superar 200 caracteres' })
  customerName: string

  @IsEmail()
  @MaxLength(254, { message: 'El email no puede superar 254 caracteres' })
  customerEmail: string

  @IsString()
  @IsPhoneNumber('CL', { message: 'Ingresa un teléfono válido (ej: +56912345678 o 912345678)' })
  @MaxLength(50, { message: 'El teléfono no puede superar 50 caracteres' })
  customerPhone: string

  @IsEnum(FulfillmentType)
  fulfillmentType: FulfillmentType

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La dirección no puede superar 500 caracteres' })
  deliveryAddress?: string

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La zona no puede superar 100 caracteres' })
  zone?: string

  @IsArray()
  @ArrayMaxSize(50, { message: 'El pedido no puede tener más de 50 líneas' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[]
}
