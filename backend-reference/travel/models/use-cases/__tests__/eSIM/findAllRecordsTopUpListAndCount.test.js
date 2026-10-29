const { findAllRecordsTopUpListAndCount } = require('../../../use-cases/eSIM');
const transaction = require('../../../entities/transaction');
const orders = require('../../../entities/order');
const {  literal } = require('sequelize');

jest.mock('../../../entities/transaction', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('findAllRecordsTopUpListAndCount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return top-up records with filtering and sorting', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            limit: 10,
            offset: 0,
            searchText: 'test',
            sort: 'ASC',
            column: 'createdAt',
            corporateId: 123,
            subCorporateUserId: 456,
            iccid: 'ICCID123456789'
        };

        const mockResponse = {
            count: 2,
            rows: [
                {
                    id: 1,
                    createdAt: '2024-01-15T12:00:00Z',
                    transactionCategory: 'Travel',
                    orderId: 'ORD12345',
                    amountInINR: 5000,
                    paymentMode: 'Credit Card',
                    eSIM: 'eSIM12345',
                    planCreatedAt: '2024-01-14T10:00:00Z',
                    metadata: '{"info": "metadata"}',
                    planId: 'PLAN001',
                    type: 'topup',
                    validity: '30 days',
                    data: '5GB'
                }
            ]
        };

        transaction.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await findAllRecordsTopUpListAndCount(mockParams);

        expect(transaction.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                attributes: expect.arrayContaining([
                    'id',
                    'createdAt',
                    'transactionCategory',
                    'orderId',
                    expect.arrayContaining([literal('order.amountInINR'), 'amountInINR']),
                    expect.arrayContaining([literal("JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.esim'))"), 'eSIM']),
                    expect.arrayContaining([literal("JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.planId'))"), 'planId']),
                    expect.arrayContaining([literal("JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.type'))"), 'type']),
                    expect.arrayContaining([literal("JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.validity'))"), 'validity']),
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
            column: 'createdAt',
            iccid: 'INVALID_ICCID'
        };

        const mockResponse = { count: 0, rows: [] };

        transaction.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await findAllRecordsTopUpListAndCount(mockParams);

        expect(transaction.findAndCountAll).toHaveBeenCalledWith(expect.any(Object));
        expect(result).toEqual(mockResponse);
    });

    it('should throw an error when database operation fails', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            limit: 10,
            offset: 0,
            searchText: 'errorcase',
            iccid: 'ICCID_ERROR'
        };

        const mockError = new Error('Database error');

        transaction.findAndCountAll.mockRejectedValue(mockError);

        await expect(findAllRecordsTopUpListAndCount(mockParams)).rejects.toThrow('Database error');
    });
});
