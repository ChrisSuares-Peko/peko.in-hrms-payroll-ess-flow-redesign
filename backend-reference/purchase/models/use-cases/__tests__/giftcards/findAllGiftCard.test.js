const { findAllGiftCard } = require('../../../use-cases/giftCards');
const giftCards = require('../../../entities/giftCards');

jest.mock('../../../entities/giftCards', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
}));
jest.mock("@logtail/node", () => ({
    Logtail: jest.fn().mockImplementation(() => ({
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));

describe('findAllGiftCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return paginated list of gift cards', async () => {
        const mockParams = { offset: 0, limit: 10, searchText: 'Amazon', sortMethod: 'name' };
        const mockReq = { LogTraceId: '12345' };
        const mockGiftCards = { count: 2, rows: [
            { id: 1, product_name: 'Amazon Gift Card', product_id: 'GC1001', brand_name: 'Amazon' },
            { id: 2, product_name: 'Google Play Gift Card', product_id: 'GC1002', brand_name: 'Google' },
        ]};

        giftCards.findAndCountAll.mockResolvedValue(mockGiftCards);

        const result = await findAllGiftCard(mockParams, mockReq);

        expect(giftCards.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            offset: mockParams.offset,
            limit: mockParams.limit,
            where: expect.any(Object),
        }));
        expect(result).toEqual(mockGiftCards);
    });

    it('should return an empty list if no gift cards match the search criteria', async () => {
        const mockParams = { offset: 0, limit: 10, searchText: 'Invalid' };
        const mockReq = { LogTraceId: '12345' };
        giftCards.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAllGiftCard(mockParams, mockReq);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should log an error and return undefined if database query fails', async () => {
        const mockParams = { offset: 0, limit: 10, searchText: 'Amazon' };
        const mockReq = { LogTraceId: '12345' };
        const mockError = new Error('Database error');

        giftCards.findAndCountAll.mockRejectedValue(mockError);

        const result = await findAllGiftCard(mockParams, mockReq);

        expect(result).toBeUndefined();
    });
});
