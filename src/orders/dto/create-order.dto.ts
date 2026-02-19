import { IsString, IsEmail, IsPhoneNumber, IsEnum, IsOptional, IsArray, ValidateNested, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'

export enum FulfillmentType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
}

class OrderItemDto {
  @IsString()
  productId: string

  @IsInt()
  @Min(1)
  quantity: number
}

export class CreateOrderDto {
  @IsString()
  customerName: string

  @IsEmail()
  customerEmail: string

  @IsString()
  customerPhone: string

  @IsEnum(FulfillmentType)
  fulfillmentType: FulfillmentType

  @IsOptional()
  @IsString()
  deliveryAddress?: string

  @IsOptional()
  @IsString()
  zone?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[]
}
