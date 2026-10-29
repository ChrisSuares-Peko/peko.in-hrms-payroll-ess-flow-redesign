const { findAllInvestmentsAndCount } = require('../../transaction');
const orders = require('../../../entities/order');

jest.mock('../../../entities/order');

describe('findAllInvestmentsAndCount', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return investment orders', async () => {
        const mockResult = { count: 3, rows: [{ id: 1 }] };
        orders.findAndCountAll.mockResolvedValue(mockResult);

        const params = {
            corporateId: 1, from: '2023-10-01', to: '2023-10-31',
            start: 0, length: 10, searchText: '', order: 'DESC', column: 0
        };

        const result = await findAllInvestmentsAndCount(params);
        expect(orders.findAndCountAll).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });
});
