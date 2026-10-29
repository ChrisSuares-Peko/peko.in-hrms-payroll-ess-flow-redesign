const { findStatusCountEcommerce } = require('../../transaction');
const orders = require('../../../entities/order');
const serviceOperator = require('../../../entities/serviceOperator');

jest.mock('../../../entities/order');
jest.mock('../../../entities/serviceOperator');

describe('findStatusCountEcommerce', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return status counts for ecommerce orders', async () => {
        serviceOperator.findOne.mockResolvedValue({ id: 10 });
        const mockResult = [
            { ecomOrderStatus: 'PENDING', count: 5 },
            { ecomOrderStatus: 'SHIPPED', count: 3 }
        ];
        orders.findAll.mockResolvedValue(mockResult);

        const result = await findStatusCountEcommerce({ serviceCategory: 'E-Commerce' });
        expect(serviceOperator.findOne).toHaveBeenCalledWith({ where: { serviceCategory: 'E-Commerce' } });
        expect(orders.findAll).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });
});
