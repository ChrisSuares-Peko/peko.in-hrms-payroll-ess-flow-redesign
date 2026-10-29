const { findAllGiftCards } = require('../../../use-cases/giftCards');
const giftCards = require('../../../entities/giftCards');
const { Op } = require('sequelize');
const {handleSortFields} = require('../../../../utils/sortHandle');

jest.mock('../../../entities/giftCards', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../../utils/sortHandle', () =>({handleSortFields: jest.fn()}));

describe('findAllGiftCards', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return paginated gift cards with correct filters', async () => {
        const mockParams = { offset: 0, limit: 10, searchText: 'Amazon', sort: 'asc', sortField: 'product_name' };
        const mockOrder = [['product_name', 'ASC']];
        const mockGiftCards = { count: 2, rows: [
            { id: 1, product_name: 'Amazon Gift Card', product_id: 'GC1001', brand_name: 'Amazon' },
            { id: 2, product_name: 'Google Play Gift Card', product_id: 'GC1002', brand_name: 'Google' },
        ]};

        handleSortFields.mockReturnValue(mockOrder);
        giftCards.findAndCountAll.mockResolvedValue(mockGiftCards);

        const result = await findAllGiftCards(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
        expect(giftCards.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                [Op.or]: expect.any(Array),
            },
            order: mockOrder,
            limit: mockParams.limit,
            offset: mockParams.offset,
        }));
        expect(result).toEqual(mockGiftCards);
    });

    it('should return an empty list if no matching gift cards are found', async () => {
        const mockParams = { offset: 0, limit: 10, searchText: 'Invalid' };
        giftCards.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAllGiftCards(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

   
});
