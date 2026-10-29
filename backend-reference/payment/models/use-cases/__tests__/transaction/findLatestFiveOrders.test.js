const orders = require('../../../entities/order'); // Adjust path
const serviceOperator = require('../../../entities/serviceOperator'); // Adjust path
const credential = require('../../../entities/credential'); // Adjust path
const {findLatestFiveOrders} = require('../../transaction'); // Adjust path

jest.mock('../../../entities/order', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => jest.fn());
jest.mock('../../../entities/credential', () => jest.fn());

describe('findLatestFiveOrders', () => {
    const mockParams = {
        length: 5,
        order: 'ASC',
        column: 'createdAt', // assuming column for ordering is createdAt
        serviceCategory: 'Office Supplies',
    };

    const mockResult = {
        count: 5,
        rows: [
            {
                id: 1,
                corporateTxnId: 'TXN001',
                status: 'Completed',
                totalPrice: 5000,
                paymentMode: 'Credit Card',
                serviceCategory: 'Office Supplies',
                credential: { name: 'Credential 1' },
            },
            {
                id: 2,
                corporateTxnId: 'TXN002',
                status: 'Pending',
                totalPrice: 7000,
                paymentMode: 'Debit Card',
                serviceCategory: 'Office Supplies',
                credential: { name: 'Credential 2' },
            },
        ],
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return latest five orders filtered by serviceCategory and ordered by specified column', async () => {
        orders.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findLatestFiveOrders(mockParams);

        expect(orders.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: serviceOperator,
                    where: {
                        serviceCategory: mockParams.serviceCategory,
                    },
                    attributes: ['serviceCategory'],
                },
                {
                    model: credential,
                    attributes: ['name'],
                },
            ],
            order: [[mockParams.column, mockParams.order]],
            limit: mockParams.length,
            raw: true,
            nest: true,
        });

        expect(result).toEqual(mockResult);
    });

    it('should handle when no orders are found and return an empty response', async () => {
        orders.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findLatestFiveOrders(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should handle an error thrown by findAndCountAll', async () => {
        const errorMessage = 'Database error';
        orders.findAndCountAll.mockRejectedValue(new Error(errorMessage));

        await expect(findLatestFiveOrders(mockParams)).rejects.toThrow(errorMessage);
    });


    it('should return orders when order is DESC', async () => {
        const paramsWithDescOrder = { ...mockParams, order: 'DESC' };

        orders.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findLatestFiveOrders(paramsWithDescOrder);

        expect(orders.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                order: [['createdAt', 'DESC']],
            })
        );

        expect(result).toEqual(mockResult);
    });
});
