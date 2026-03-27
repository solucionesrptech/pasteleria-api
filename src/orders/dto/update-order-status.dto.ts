import { IsEnum } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { OrderStatus } from '../../generated/prisma/client'

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, description: 'Nuevo estado de la orden' })
  @IsEnum(OrderStatus)
  status: OrderStatus
}
