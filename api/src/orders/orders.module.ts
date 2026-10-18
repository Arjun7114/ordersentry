import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order, OrderSchema } from './entities/order.entity';
import { RiskService } from './risk.service';

@Module({
  imports: [
    // Registers the Order model with Mongoose, scoped to this module.
    // This is what lets the service inject and query the orders collection.
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, RiskService],
})
export class OrdersModule { }