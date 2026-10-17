import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';

// A fake Mongoose model. The tests run against this, NOT the real
// Atlas database — so they're fast, isolated, and never write junk
// to the real orders collection.
const mockOrder = {
    _id: 'abc123',
    customerName: 'Test User',
    amount: 999,
    status: OrderStatus.PENDING,
    riskScore: null,
};

describe('OrdersService', () => {
    let service: OrdersService;
    let model: any;

    beforeEach(async () => {
        model = {
            find: jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue([mockOrder]),
                }),
            }),
            findById: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockOrder),
            }),
            findByIdAndUpdate: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue({
                    ...mockOrder,
                    status: OrderStatus.CONFIRMED,
                }),
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersService,
                { provide: getModelToken(Order.name), useValue: model },
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('findAll() returns a list of orders', async () => {
        const result = await service.findAll();
        expect(result).toEqual([mockOrder]);
        expect(model.find).toHaveBeenCalled();
    });

    it('findOne() returns a single order when it exists', async () => {
        const result = await service.findOne('abc123');
        expect(result).toEqual(mockOrder);
        expect(model.findById).toHaveBeenCalledWith('abc123');
    });

    it('findOne() throws NotFoundException when the order is missing', async () => {
        // Override findById to simulate "not found"
        model.findById.mockReturnValueOnce({
            exec: jest.fn().mockResolvedValue(null),
        });
        await expect(service.findOne('missing')).rejects.toThrow(
            NotFoundException,
        );
    });

    it('updateStatus() returns the order with its new status', async () => {
        const result = await service.updateStatus('abc123', OrderStatus.CONFIRMED);
        expect(result.status).toEqual(OrderStatus.CONFIRMED);
        expect(model.findByIdAndUpdate).toHaveBeenCalled();
    });
});