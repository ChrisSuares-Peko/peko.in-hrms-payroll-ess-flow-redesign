const { findAll } = require('../../../use-cases/couponCode');
const couponCode = require('../../../entities/couponCode');
const { Op } = require('sequelize');
const {handleSortFields} = require('../../../../utils/sortHandle');

jest.mock('../../../entities/couponCode', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));


describe('findAll', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return paginated list of coupon codes', async () => {
        const mockParams = { limit: 10, offset: 0, searchText: 'DISCOUNT', sort: 'ASC', sortField: 'id' };
        const mockOrder = [['id', 'ASC']];
        const mockCoupons = {
            count: 2,
            rows: [
                { id: 1, couponCode: 'DISCOUNT10', discountType: 'Fixed', discount: 10, validFrom: '2023-01-01', validTo: '2023-12-31' },
                { id: 2, couponCode: 'DISCOUNT20', discountType: 'Percentage', discount: 20, validFrom: '2023-01-01', validTo: '2023-12-31' },
            ],
        };

        handleSortFields.mockReturnValue(mockOrder);
        couponCode.findAndCountAll.mockResolvedValue(mockCoupons);

        const result = await findAll(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
        expect(couponCode.findAndCountAll).toHaveBeenCalledWith({
            where: {
                [Op.or]: expect.any(Array),
            },
            order: mockOrder,
            limit: mockParams.limit,
            offset: mockParams.offset,
        });
        expect(result).toEqual(mockCoupons);
    });

    it('should return an empty result if no coupons match the search', async () => {
        const mockParams = { limit: 10, offset: 0, searchText: 'INVALID' };
        couponCode.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAll(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

   
});
