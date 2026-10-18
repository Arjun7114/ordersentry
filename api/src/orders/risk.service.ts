import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class RiskService {
    private readonly logger = new Logger(RiskService.name);
    private readonly baseUrl: string;

    constructor(private config: ConfigService) {
        this.baseUrl =
            this.config.get<string>('RISK_SERVICE_URL') ?? 'http://localhost:8001';
    }

    /**
     * Ask the Python ML service to score an order's fraud/RTO risk.
     * Best-effort: if the service is down or errors, returns null so the
     * order can still be created without a score.
     */
    async scoreOrder(dto: CreateOrderDto): Promise<number | null> {
        // Map our order fields to the features the model expects.
        // Fields we don't collect (age, account age, device) use neutral
        // defaults for now — an honest placeholder until the order form
        // captures them.
        const payload = {
            transactionAmount: dto.amount,
            quantity: 1,
            customerAge: 30,
            accountAgeDays: 90,
            transactionHour: new Date().getHours(),
            addressMismatch: 0,
            paymentMethod: (dto.paymentMethod ?? 'COD').toLowerCase(),
            productCategory: 'electronics',
            deviceUsed: 'desktop',
        };

        try {
            const res = await fetch(`${this.baseUrl}/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(3000), // don't hang if service is slow
            });
            if (!res.ok) {
                this.logger.warn(`Risk service returned ${res.status}`);
                return null;
            }
            const data = (await res.json()) as { riskScore: number };
            return data.riskScore;
        } catch (err) {
            // Service down / timeout / network error — non-blocking.
            this.logger.warn(`Risk scoring skipped: ${(err as Error).message}`);
            return null;
        }
    }
}