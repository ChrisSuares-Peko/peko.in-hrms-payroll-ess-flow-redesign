const serviceOperator = require('../../../entities/serviceOperator'); // Adjust path
const orders = require('../../../entities/order'); // Adjust path
const {findStatusCountEcommerce} = require('../../transaction'); // Adjust path

jest.mock('../../../entities/serviceOperator', () => ({
    findOne: jest.fn(),
}));

jest.mock('../../../entities/order', () => ({
    findAll: jest.fn(),
}));

describe('findStatusCountEcommerce', () => {
    const mockParams = {
        serviceCategory: 'Office Supplies',
    };

    const mockServiceOperator = {
        id: 1,
        serviceCategory: 'Office Supplies',
    };

    // const mockOrderResults = [
    //     { ecomOrderStatus: 'PENDING', count: 5 },
    //     { ecomOrderStatus: 'CONFIRMED', count: 3 },
    //     { ecomOrderStatus: 'SHIPPED', count: 7 },
    // ];

    beforeEach(() => {
        jest.clearAllMocks();
    });



    it('should handle errors thrown by serviceOperator.findOne', async () => {
        const errorMessage = 'Database error';
        serviceOperator.findOne.mockRejectedValue(new Error(errorMessage));

        await expect(findStatusCountEcommerce(mockParams)).rejects.toThrow(errorMessage);
    });

    it('should handle errors thrown by orders.findAll', async () => {
        // Mock the response of serviceOperator.findOne
        serviceOperator.findOne.mockResolvedValue(mockServiceOperator);

        const errorMessage = 'Database error';
        orders.findAll.mockRejectedValue(new Error(errorMessage));

        await expect(findStatusCountEcommerce(mockParams)).rejects.toThrow(errorMessage);
    });

    it('should return the correct data even if there are no orders with specific statuses', async () => {
        const mockEmptyResults = [];
        // Mock the response of orders.findAll to return an empty array
        orders.findAll.mockResolvedValue(mockEmptyResults);

        const result = await findStatusCountEcommerce(mockParams);

        expect(result).toEqual(mockEmptyResults);
    });
});
