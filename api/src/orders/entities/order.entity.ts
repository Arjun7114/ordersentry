import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

// Allowed order states. Keeping these as a fixed set so the API
// can't store a nonsense status.
export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    RTO = 'RTO', // return-to-origin: came back undelivered
    CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true }) // auto-adds createdAt / updatedAt
export class Order {
    @Prop({ required: true })
    customerName: string;

    @Prop({ required: true })
    customerPhone: string;

    @Prop({ required: true })
    shippingAddress: string;

    @Prop({ required: true })
    pincode: string;

    @Prop({ required: true, min: 0 })
    amount: number;

    @Prop({ default: 'COD' })
    paymentMethod: string;

    @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
    status: OrderStatus;

    // Risk score lives here. Null until the Phase 3 AI layer scores it.
    // Honest default: we don't fake a score, we leave it unset.
    @Prop({ type: Number, default: null })
    riskScore: number | null;
}

export const OrderSchema = SchemaFactory.createForClass(Order);