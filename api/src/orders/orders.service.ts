import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { RiskService } from './risk.service';

@Injectable()
export class OrdersService {
  // Mongoose injects the Order model here, so we can query the collection.
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private riskService: RiskService,
  ) { }

  // Create and save a new order.
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // Score the order's risk (best-effort; null if the ML service is down).
    const riskScore = await this.riskService.scoreOrder(createOrderDto);
    const created = new this.orderModel({ ...createOrderDto, riskScore });
    return created.save();
  }

  // Return all orders, newest first.
  async findAll(): Promise<Order[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).exec();
  }

  // Find one order by its id; 404 if it doesn't exist.
  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  // Update just the status of an order; 404 if it doesn't exist.
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const updated = await this.orderModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return updated;
  }
}
