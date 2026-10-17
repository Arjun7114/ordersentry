import { IsEnum } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

// Only a valid OrderStatus value is accepted when updating status.
export class UpdateOrderStatusDto {
    @IsEnum(OrderStatus)
    status: OrderStatus;
}