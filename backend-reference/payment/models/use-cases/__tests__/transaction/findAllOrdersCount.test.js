const { Op } = require('sequelize');
const orders = require('../../../entities/order'); // Adjusted path
const serviceOperator = require('../../../entities/serviceOperator'); // Adjusted path
const credential = require('../../../entities/credential'); // Adjusted path
const {findAllOrdersCount} = require('../../transaction'); // Adjusted path



jest.mock('../../../entities/order', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => jest.fn());
jest.mock('../../../entities/credential', () => jest.fn());

describe('findAllOrdersCount', () => {
    const mockParams = {
        start: 0,
        from: '2024-01-01',
        to: '2024-12-31',
        length: 10,
        searchText: 'Test',
        order: 'ASC',
        column: 1,
    };

    const mockResult = {
        count: 2,
        rows: [
            {
                id: 1,
                corporateTxnId: 'TXN123',
                'credential.name': 'Corporate A',
                productName: 'Product X',
                transactionDate: '2024-01-15',
                totalPrice: 5000,
                paymentMode: 'Credit Card',
                status: 'Completed',
            },
            {
                id: 2,
                corporateTxnId: 'TXN124',
                'credential.name': 'Corporate B',
                productName: 'Product Y',
                transactionDate: '2024-02-15',
                totalPrice: 7000,
                paymentMode: 'Net Banking',
                status: 'Pending',
            },
        ],
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return filtered and sorted orders', async () => {
        // Mock database response
        orders.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findAllOrdersCount(mockParams);

        expect(orders.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: serviceOperator,
                    where: {
                        serviceCategory: 'Office Supplies',
                    },
                },
                {
                    model: credential,
                    attributes: ['name'],
                },
            ],
            where: {
                [Op.or]: [
                    { id: { [Op.like]: '%Test%' } },
                    { corporateTxnId: { [Op.like]: '%Test%' } },
                    { operatorId: { [Op.like]: '%Test%' } },
                    { amountInINR: { [Op.like]: '%Test%' } },
                    { baseAmount: { [Op.like]: '%Test%' } },
                    { baseCurrency: { [Op.like]: '%Test%' } },
                    { exchangeRate: { [Op.like]: '%Test%' } },
                    { status: { [Op.like]: '%Test%' } },
                    { paymentMode: { [Op.like]: '%Test%' } },
                    { '$credential.name$': { [Op.like]: '%Test%' } },
                    { message: { [Op.like]: '%Test%' } },
                ],
                transactionDate: {
                    [Op.between]: [mockParams.from, mockParams.to],
                },
            },
            order: [['credential.name', 'ASC']], // Column index 1 maps to "credential.name"
            limit: mockParams.length,
            offset: mockParams.start,
            raw: true,
            nest: true,
        });

        expect(result).toEqual(mockResult);
    });

   

    it('should return default sorting column if column index is invalid', async () => {
        // Modify params with invalid column
        const invalidColumnParams = { ...mockParams, column: 999 };

        orders.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findAllOrdersCount(invalidColumnParams);

        expect(orders.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                order: [['updatedAt', 'ASC']], // Default sorting column
            })
        );

        expect(result).toEqual(mockResult);
    });

    it('should handle empty results', async () => {
        orders.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAllOrdersCount(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should throw an error if findAndCountAll fails', async () => {
        const errorMessage = 'Database error';
        orders.findAndCountAll.mockRejectedValue(new Error(errorMessage));

        await expect(findAllOrdersCount(mockParams)).rejects.toThrow(errorMessage);
    });
});
