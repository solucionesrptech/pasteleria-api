import { OrderStatus, FulfillmentType } from '../../generated/prisma/client'

export class InternalOrderItemDto {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPriceCLP: number
  lineTotalCLP: number
}

export class InternalOrderResponseDto {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  fulfillmentType: FulfillmentType
  deliveryAddress?: string | null
  zone?: string | null
  totalCLP: number
  status: OrderStatus
  publicToken: string
  createdAt: Date
  updatedAt: Date
  items: InternalOrderItemDto[]
}
