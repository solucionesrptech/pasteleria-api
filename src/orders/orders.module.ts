import { Module } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { PrismaModule } from '../prisma/prisma.module'
import { ProductsModule } from '../products/products.module'

@Module({
  imports: [PrismaModule, ProductsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
