const { findAllRecordsOrderListAndCount } = require('../../../use-cases/eSIM');
const transaction = require('../../../entities/transaction');
const orders = require('../../../entities/order');
const { literal } = require('sequelize');

jest.mock('../../../entities/transaction', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('findAllRecordsOrderListAndCount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return records count with filtering and sorting', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            limit: 10,
            offset: 0,
            searchText: 'test',
            sort: 'ASC',
            column: 'createdAt',
            corporateId: 123,
            subCorporateUserId: 456
        };

        const mockResponse = {
            count: 2,
            rows: [
                {
                    createdAt: '2024-01-15T12:00:00Z',
                    transactionCategory: 'Travel',
                    orderId: 'ORD12345',
                    amountInINR: 5000,
                    paymentMode: 'Credit Card',
                    simDetailsId: 'SIM789',
                    simDetailsEsim: 'eSIM12345',
                    simDetailsCreatedAt: '2024-01-14T10:00:00Z',
                    simDetailsMetadata: '{"info": "metadata"}',
                    simDetailsPlanId: 'PLAN001'
                }
            ]
        };

        transaction.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await findAllRecordsOrderListAndCount(mockParams);

        expect(transaction.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                attributes: expect.arrayContaining([
                    'createdAt',
                    'transactionCategory',
                    'orderId',
                    expect.arrayContaining([literal('order.amountInINR'), 'amountInINR']),
                    expect.arrayContaining([literal("JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.esim'))"), 'simDetailsEsim']),
                ]),
                include: expect.arrayContaining([
                    expect.objectContaining({ model: orders, attributes: [] })
                ]),
                where: expect.any(Object),
                order: [['createdAt', 'ASC']],
                limit: 10,
                offset: 0
            })
        );

        expect(result).toEqual(mockResponse);
    });

    it('should return empty records when no matching data is found', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            limit: 10,
            offset: 0,
            searchText: 'notfound',
            sort: 'DESC',
            column: 'createdAt'
        };

        const mockResponse = { count: 0, rows: [] };

        transaction.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await findAllRecordsOrderListAndCount(mockParams);

        expect(transaction.findAndCountAll).toHaveBeenCalledWith(expect.any(Object));
        expect(result).toEqual(mockResponse);
    });

    it('should throw an error when database operation fails', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            limit: 10,
            offset: 0,
            searchText: 'errorcase'
        };

        const mockError = new Error('Database error');

        transaction.findAndCountAll.mockRejectedValue(mockError);

        await expect(findAllRecordsOrderListAndCount(mockParams)).rejects.toThrow('Database error');
    });
});
