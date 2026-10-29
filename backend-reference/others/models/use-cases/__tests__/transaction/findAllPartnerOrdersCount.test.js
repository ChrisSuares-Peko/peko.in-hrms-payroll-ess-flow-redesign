const { findAllPartnerOrdersCount } = require('../../transaction');
const orders = require('../../../entities/order');

jest.mock('../../../entities/order');

describe('findAllPartnerOrdersCount', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return partner orders count', async () => {
        const mockResult = { count: 5, rows: [{ id: 1 }] };
        orders.findAndCountAll.mockResolvedValue(mockResult);

        const params = {
            corporateId: 1, start: 0, from: '2023-10-01', to: '2023-10-31',
            length: 10, searchText: '', order: 'DESC', column: 0, partnerId: 5
        };

        const result = await findAllPartnerOrdersCount(params);
        expect(orders.findAndCountAll).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });
});
