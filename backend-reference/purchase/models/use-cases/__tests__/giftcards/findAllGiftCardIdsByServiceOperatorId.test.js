const { findAllGiftCardIdsByServiceOperatorId } = require('../../../use-cases/giftCards');
const giftCards = require('../../../entities/giftCards');

jest.mock('../../../entities/giftCards', () => ({
    findAll: jest.fn(),
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
describe('findAllGiftCardIdsByServiceOperatorId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a map of gift card IDs for a given serviceOperatorId', async () => {
        const mockServiceOperatorId = 10;
        const mockGiftCards = [
            { product_id: 101, name: 'Amazon Gift Card' },
            { product_id: 102, name: 'Google Play Gift Card' },
        ];

        const expectedMap = new Map(mockGiftCards.map((giftCard) => [giftCard.product_id, giftCard]));

        giftCards.findAll.mockResolvedValue(mockGiftCards);

        const result = await findAllGiftCardIdsByServiceOperatorId(mockServiceOperatorId);

        expect(giftCards.findAll).toHaveBeenCalledWith({
            where: { serviceOperatorId: mockServiceOperatorId },
        });
        expect(result).toEqual(expectedMap);
    });

    it('should return an empty map if no gift cards are found', async () => {
        const mockServiceOperatorId = 10;
        giftCards.findAll.mockResolvedValue([]);

        const result = await findAllGiftCardIdsByServiceOperatorId(mockServiceOperatorId);

        expect(result).toEqual(new Map());
    });

    it('should handle errors if database query fails', async () => {
        const mockServiceOperatorId = 10;
        const mockError = new Error('Database error');

        giftCards.findAll.mockRejectedValue(mockError);

        await expect(findAllGiftCardIdsByServiceOperatorId(mockServiceOperatorId)).rejects.toThrow('Database error');
    });
});
