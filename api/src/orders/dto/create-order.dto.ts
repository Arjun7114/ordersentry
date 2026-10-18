import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    Min,
} from 'class-validator';

export class CreateOrderDto {
    @IsString()
    @IsNotEmpty()
    customerName: string;

    // Indian mobile: exactly 10 digits, starting 6-9.
    @IsString()
    @Matches(/^[6-9]\d{9}$/, {
        message: 'customerPhone must be a valid 10-digit Indian mobile number',
    })
    customerPhone: string;

    @IsString()
    @IsNotEmpty()
    shippingAddress: string;

    // Indian pincode: exactly 6 digits, not starting with 0.
    @IsString()
    @Matches(/^[1-9]\d{5}$/, {
        message: 'pincode must be a valid 6-digit Indian pincode',
    })
    pincode: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsString()
    @IsOptional()
    paymentMethod?: string;
}