const {
    createOrder,
    findOneOrder,
    findAllOrder,
    updateOrder,
    deleteOrder,
    getExcel,
    findOneByProviderId,
    findOneOrderById
} = require('../../order');
const order = require('../../../entities/order');
const transaction = require('../../../entities/transaction');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('createOrder', () => {
    it('should create an order', async () => {
        const mockResult = { id: 1, corporateTxnId: 'TXN1' };
        order.create.mockResolvedValue(mockResult);

        const result = await createOrder({ corporateTxnId: 'TXN1' });
        expect(result).toEqual(mockResult);
    });

    it('should return undefined on error', async () => {
        order.create.mockRejectedValue(new Error('DB Error'));

        const result = await createOrder({});
        expect(result).toBeUndefined();
    });
});

describe('findOneOrder', () => {
    it('should find one order by corporateTxnId', async () => {
        const mockResult = { id: 1, corporateTxnId: 'TXN1' };
        order.findOne.mockResolvedValue(mockResult);

        const result = await findOneOrder({ corporateTxnId: 'TXN1' });
        expect(result).toEqual(mockResult);
        expect(order.findOne).toHaveBeenCalledWith({
            where: { corporateTxnId: 'TXN1' }
        });
    });
});

describe('findAllOrder', () => {
    it('should find all orders by orderId', async () => {
        const mockResult = [{ id: 1 }];
        order.findAll.mockResolvedValue(mockResult);

        const result = await findAllOrder({ orderId: 'ORD1' });
        expect(result).toEqual(mockResult);
    });
});

describe('updateOrder', () => {
    it('should update an order', async () => {
        order.update.mockResolvedValue([1]);

        const result = await updateOrder({ id: 1 }, { status: 'SUCCESS' });
        expect(result).toEqual([1]);
    });
});

describe('deleteOrder', () => {
    it('should delete an order', async () => {
        order.destroy.mockResolvedValue(1);

        const result = await deleteOrder({ orderId: 'ORD1' });
        expect(result).toBe(1);
    });
});

describe('findOneByProviderId', () => {
    it('should find an order by providerId', async () => {
        const mockResult = { id: 1, providerId: 'P1' };
        order.findOne.mockResolvedValue(mockResult);

        const result = await findOneByProviderId({ providerId: 'P1' });
        expect(result).toEqual(mockResult);
    });
});

describe('findOneOrderById', () => {
    it('should find an order by id', async () => {
        const mockResult = { id: 1 };
        order.findOne.mockResolvedValue(mockResult);

        const result = await findOneOrderById(1);
        expect(result).toEqual(mockResult);
        expect(order.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });
});

describe('getExcel', () => {
    it('should format order data for Excel export', async () => {
        transaction.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{
                transactionDate: '2026-01-15T10:00:00Z',
                credential: { name: 'Corp1' },
                providerId: 'P1',
                corporateTxnId: 'TXN1',
                transactionCategory: 'PAYMENT',
                serviceOperator: { serviceProvider: 'TestOp' },
                order: { amountInINR: '100.50', paymentMode: 'WALLET', status: 'SUCCESS' }
            }]
        });

        const result = await getExcel({
            from: '2026-01-01', to: '2026-12-31',
            order: 'DESC', column: 'createdAt',
            corporateId: null, categoryName: 'null'
        });
        expect(result[0]).toHaveProperty('Date');
        expect(result[0]['Corporate Name']).toBe('Corp1');
        expect(result[0]['Transaction Id']).toBe('TXN1');
        expect(result[0]['Status']).toBe('SUCCESS');
    });
});
