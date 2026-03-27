import { Injectable } from '@nestjs/common'
import { PaymentStatus } from '../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'

export type LossReportRange = 'daily' | 'weekly' | 'monthly'

export interface LossSummary {
  totalUnitsLost: number
  count: number
  estimatedCostCLP: number
}

export interface LossItem {
  createdAt: Date
  productId: string
  productName: string
  quantity: number
  reason: string | null
  userId: string | null
  userEmail: string | null
  estimatedCostCLP: number
}

export interface DailySalesSummary {
  totalSalesCLP: number
  paidOrdersCount: number
  unitsSold: number
}

export interface DailySalesProduct {
  productId: string
  productName: string
  quantitySold: number
  totalSalesCLP: number
}

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDailySales(): Promise<{ summary: DailySalesSummary; products: DailySalesProduct[] }> {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    const paymentsPaidToday = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      select: { orderId: true },
      distinct: ['orderId'],
    })

    const orderIds = paymentsPaidToday.map((p) => p.orderId)
    if (orderIds.length === 0) {
      return {
        summary: { totalSalesCLP: 0, paidOrdersCount: 0, unitsSold: 0 },
        products: [],
      }
    }

    const orders = await this.prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        items: { include: { product: { select: { id: true, name: true } } } },
      },
    })

    let totalSalesCLP = 0
    let unitsSold = 0
    const productMap = new Map<string, { productName: string; quantitySold: number; totalSalesCLP: number }>()

    for (const order of orders) {
      totalSalesCLP += order.totalCLP
      for (const item of order.items) {
        unitsSold += item.quantity
        const existing = productMap.get(item.productId)
        if (existing) {
          existing.quantitySold += item.quantity
          existing.totalSalesCLP += item.lineTotalCLP
        } else {
          productMap.set(item.productId, {
            productName: item.product.name,
            quantitySold: item.quantity,
            totalSalesCLP: item.lineTotalCLP,
          })
        }
      }
    }

    const products: DailySalesProduct[] = Array.from(productMap.entries()).map(([productId, data]) => ({
      productId,
      productName: data.productName,
      quantitySold: data.quantitySold,
      totalSalesCLP: data.totalSalesCLP,
    }))

    return {
      summary: {
        totalSalesCLP,
        paidOrdersCount: orders.length,
        unitsSold,
      },
      products,
    }
  }

  async getWeeklySales(): Promise<{ summary: DailySalesSummary; products: DailySalesProduct[] }> {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - daysToMonday)
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const paymentsPaidThisWeek = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        createdAt: { gte: startOfWeek, lte: endOfWeek },
      },
      select: { orderId: true },
      distinct: ['orderId'],
    })

    const orderIds = paymentsPaidThisWeek.map((p) => p.orderId)
    if (orderIds.length === 0) {
      return {
        summary: { totalSalesCLP: 0, paidOrdersCount: 0, unitsSold: 0 },
        products: [],
      }
    }

    const orders = await this.prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        items: { include: { product: { select: { id: true, name: true } } } },
      },
    })

    let totalSalesCLP = 0
    let unitsSold = 0
    const productMap = new Map<string, { productName: string; quantitySold: number; totalSalesCLP: number }>()

    for (const order of orders) {
      totalSalesCLP += order.totalCLP
      for (const item of order.items) {
        unitsSold += item.quantity
        const existing = productMap.get(item.productId)
        if (existing) {
          existing.quantitySold += item.quantity
          existing.totalSalesCLP += item.lineTotalCLP
        } else {
          productMap.set(item.productId, {
            productName: item.product.name,
            quantitySold: item.quantity,
            totalSalesCLP: item.lineTotalCLP,
          })
        }
      }
    }

    const products: DailySalesProduct[] = Array.from(productMap.entries()).map(([productId, data]) => ({
      productId,
      productName: data.productName,
      quantitySold: data.quantitySold,
      totalSalesCLP: data.totalSalesCLP,
    }))

    return {
      summary: {
        totalSalesCLP,
        paidOrdersCount: orders.length,
        unitsSold,
      },
      products,
    }
  }

  async getMonthlySales(): Promise<{ summary: DailySalesSummary; products: DailySalesProduct[] }> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const paymentsPaidThisMonth = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { orderId: true },
      distinct: ['orderId'],
    })

    const orderIds = paymentsPaidThisMonth.map((p) => p.orderId)
    if (orderIds.length === 0) {
      return {
        summary: { totalSalesCLP: 0, paidOrdersCount: 0, unitsSold: 0 },
        products: [],
      }
    }

    const orders = await this.prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        items: { include: { product: { select: { id: true, name: true } } } },
      },
    })

    let totalSalesCLP = 0
    let unitsSold = 0
    const productMap = new Map<string, { productName: string; quantitySold: number; totalSalesCLP: number }>()

    for (const order of orders) {
      totalSalesCLP += order.totalCLP
      for (const item of order.items) {
        unitsSold += item.quantity
        const existing = productMap.get(item.productId)
        if (existing) {
          existing.quantitySold += item.quantity
          existing.totalSalesCLP += item.lineTotalCLP
        } else {
          productMap.set(item.productId, {
            productName: item.product.name,
            quantitySold: item.quantity,
            totalSalesCLP: item.lineTotalCLP,
          })
        }
      }
    }

    const products: DailySalesProduct[] = Array.from(productMap.entries()).map(([productId, data]) => ({
      productId,
      productName: data.productName,
      quantitySold: data.quantitySold,
      totalSalesCLP: data.totalSalesCLP,
    }))

    return {
      summary: {
        totalSalesCLP,
        paidOrdersCount: orders.length,
        unitsSold,
      },
      products,
    }
  }

  private getDateRange(range: LossReportRange): { start: Date; end: Date } {
    const now = new Date()
    let start: Date
    let end: Date
    if (range === 'daily') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    } else if (range === 'weekly') {
      const dayOfWeek = now.getDay()
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      start = new Date(now)
      start.setDate(now.getDate() - daysToMonday)
      start.setHours(0, 0, 0, 0)
      end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }
    return { start, end }
  }

  async getLossesByRange(range: LossReportRange): Promise<{ summary: LossSummary; items: LossItem[] }> {
    const { start, end } = this.getDateRange(range)

    const movements = await this.prisma.inventoryMovement.findMany({
      where: {
        type: 'LOSS',
        createdAt: { gte: start, lte: end },
      },
      include: {
        product: { select: { id: true, name: true, priceCLP: true } },
        user: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    let totalUnitsLost = 0
    let estimatedCostCLP = 0
    const items: LossItem[] = movements.map((m) => {
      const cost = m.quantity * m.product.priceCLP
      totalUnitsLost += m.quantity
      estimatedCostCLP += cost
      return {
        createdAt: m.createdAt,
        productId: m.productId,
        productName: m.product.name,
        quantity: m.quantity,
        reason: m.reason,
        userId: m.userId,
        userEmail: m.user?.email ?? null,
        estimatedCostCLP: cost,
      }
    })

    return {
      summary: {
        totalUnitsLost,
        count: movements.length,
        estimatedCostCLP,
      },
      items,
    }
  }
}
