import { OrderStatus, FulfillmentType } from '@prisma/client'

export class OrderItemResponseDto {
  id: string
  productId: string
  quantity: number
  unitPriceCLP: number
  lineTotalCLP: number
  createdAt: Date
}

export class OrderResponseDto {
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
  items: OrderItemResponseDto[]
}
