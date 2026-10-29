const { findAllSubscriptionOrders } = require('../../transaction'); // Adjust path as needed
const orders = require('../../../entities/order'); // Adjust path as needed
const serviceOperator = require('../../../entities/serviceOperator'); // Adjust path as needed
const credential = require('../../../entities/credential'); // Adjust path as needed
const { Op } = require('sequelize');

// Mock the necessary Sequelize methods and models
jest.mock('../../../entities/order', () => ({
    findAndCountAll: jest.fn(),
}));


describe('findAllSubscriptionOrders', () => {
    const mockParams = {
        start: 0,
        from: '2024-01-01',
        to: '2024-12-31',
        length: 10,
        searchText: 'testSearch',
        order: 'ASC',
        column: 0,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call findAndCountAll with correct parameters and return the result', async () => {
        const mockResponse = {
            rows: [{ id: 1, corporateTxnId: 'txn123', amountInINR: 1000 }],
            count: 1,
        };
        orders.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await findAllSubscriptionOrders(mockParams);

        expect(orders.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: serviceOperator,
                    where: {
                        serviceCategory: 'Subscriptions',
                    },
                },
                {
                    model: credential,
                    attributes: ['name', 'email'],
                },
            ],
            where: {
                transactionDate: {
                    [Op.between]: ['2024-01-01', '2024-12-31'],
                },
                [Op.or]: [
                    { id: { [Op.like]: '%testSearch%' } },
                    { corporateTxnId: { [Op.like]: '%testSearch%' } },
                    { operatorId: { [Op.like]: '%testSearch%' } },
                    { amountInINR: { [Op.like]: '%testSearch%' } },
                    { baseAmount: { [Op.like]: '%testSearch%' } },
                    { baseCurrency: { [Op.like]: '%testSearch%' } },
                    { exchangeRate: { [Op.like]: '%testSearch%' } },
                    { status: { [Op.like]: '%testSearch%' } },
                    { paymentMode: { [Op.like]: '%testSearch%' } },
                    { '$credential.name$': { [Op.like]: '%testSearch%' } },
                    { message: { [Op.like]: '%testSearch%' } },
                ],
            },
            order: [['corporateTxnId', 'ASC']],
            limit: 10,
            offset: 0,
            raw: true,
            nest: true,
        });

        expect(result).toEqual(mockResponse);
    });

    it('should set default column to createdAt if an invalid column index is provided', async () => {
        const mockResponse = {
            rows: [{ id: 1, corporateTxnId: 'txn123', amountInINR: 1000 }],
            count: 1,
        };
        orders.findAndCountAll.mockResolvedValue(mockResponse);

        const invalidParams = { ...mockParams, column: 999 }; // Invalid column index
        const result = await findAllSubscriptionOrders(invalidParams);

        expect(orders.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            order: [['createdAt', 'ASC']], // Default column
        }));
        expect(result).toEqual(mockResponse);
    });

    it('should handle empty results and return empty rows', async () => {
        const mockResponse = {
            rows: [],
            count: 0,
        };
        orders.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await findAllSubscriptionOrders(mockParams);

        expect(result).toEqual(mockResponse);
    });

    it('should throw an error if findAndCountAll fails', async () => {
        const mockError = new Error('Database error');
        orders.findAndCountAll.mockRejectedValue(mockError);

        await expect(findAllSubscriptionOrders(mockParams)).rejects.toThrow('Database error');
    });
});
