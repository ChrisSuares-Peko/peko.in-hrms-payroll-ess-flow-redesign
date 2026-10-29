const { findSingleGiftCard } = require('../../../use-cases/giftCards');
const giftCards = require('../../../entities/giftCards');

jest.mock('../../../entities/giftCards', () => ({
    findOne: jest.fn(),
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
describe('findSingleGiftCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a single gift card if found', async () => {
        const mockGiftCardId = 1;
        const mockGiftCard = { id: mockGiftCardId, name: 'Amazon Gift Card', brand_logo: 'logo.png' };

        giftCards.findOne.mockResolvedValue(mockGiftCard);

        const result = await findSingleGiftCard(mockGiftCardId);

        expect(giftCards.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: mockGiftCardId },
                attributes: { exclude: ["createdAt", "updatedAt", "commissionMode", "commissionType", "commission", "fixedCommissionPerTransaction", "isCommissionInclGST", "isCommissionConfigured"] },
            })
        );
        expect(result).toEqual(mockGiftCard);
    });

    it('should keep the commission columns when the caller asks for them (payment journal)', async () => {
        giftCards.findOne.mockResolvedValue({ id: 1 });

        await findSingleGiftCard(1, { includeCommission: true });

        expect(giftCards.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ attributes: { exclude: ["createdAt", "updatedAt"] } })
        );
    });

    it('should return null if no matching gift card is found', async () => {
        const mockGiftCardId = 999;
        giftCards.findOne.mockResolvedValue(null);

        const result = await findSingleGiftCard(mockGiftCardId);

        expect(result).toBeNull();
    });

    it('should throw an error if database query fails', async () => {
        const mockGiftCardId = 1;
        const mockError = new Error('Database error');

        giftCards.findOne.mockRejectedValue(mockError);

        await expect(findSingleGiftCard(mockGiftCardId)).rejects.toThrow('Database error');
    });
});