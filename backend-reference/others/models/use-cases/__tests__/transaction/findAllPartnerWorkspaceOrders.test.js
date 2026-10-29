const { findAllPartnerWorkspaceOrders } = require('../../transaction');
const orders = require('../../../entities/order');

jest.mock('../../../entities/order');
jest.mock('../../../../utils/sortHandle', () => ({ handleSortFields: jest.fn(() => [['createdAt', 'DESC']]) }));

describe('findAllPartnerWorkspaceOrders', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return partner workspace orders', async () => {
        const mockResult = { count: 2, rows: [{ id: 1 }] };
        orders.findAndCountAll.mockResolvedValue(mockResult);

        const params = {
            from: '2023-10-01', to: '2023-10-31', limit: 10, offset: 0,
            searchText: '', sort: 'DESC', sortField: 'createdAt',
            corporateId: null, partnerId: 5
        };

        const result = await findAllPartnerWorkspaceOrders(params);
        expect(orders.findAndCountAll).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });
});
