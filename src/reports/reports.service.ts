import { BadRequestException, Injectable } from '@nestjs/common'
import { SalesReportResponseDto } from './dto/sales-report-response.dto'
import { ReportsRepository } from './reports.repository'

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  async getSalesReport(range: string): Promise<SalesReportResponseDto> {
    let salesResult: { summary: { totalSalesCLP: number; paidOrdersCount: number; unitsSold: number }; products: { productId: string; productName: string; quantitySold: number; totalSalesCLP: number }[] }
    if (range === 'daily') {
      salesResult = await this.reportsRepository.getDailySales()
    } else if (range === 'weekly') {
      salesResult = await this.reportsRepository.getWeeklySales()
    } else if (range === 'monthly') {
      salesResult = await this.reportsRepository.getMonthlySales()
    } else {
      throw new BadRequestException('Rango no válido: use daily, weekly o monthly')
    }

    const lossResult = await this.reportsRepository.getLossesByRange(range as 'daily' | 'weekly' | 'monthly')

    return {
      range,
      summary: salesResult.summary,
      products: salesResult.products,
      lossSummary: lossResult.summary,
      losses: lossResult.items,
    }
  }
}
