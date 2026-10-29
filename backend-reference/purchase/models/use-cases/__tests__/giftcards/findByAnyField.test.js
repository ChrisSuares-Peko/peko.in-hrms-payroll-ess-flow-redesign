const { findByAnyField } = require('../../../use-cases/giftCards');
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
describe('findByAnyField', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a gift card if found by any field', async () => {
        const mockQuery = { name: 'Amazon Gift Card' };
        const mockGiftCard = { id: 1, name: 'Amazon Gift Card', brand_logo: 'logo.png' };

        giftCards.findOne.mockResolvedValue(mockGiftCard);

        const result = await findByAnyField(mockQuery);

        expect(giftCards.findOne).toHaveBeenCalledWith({ where: mockQuery });
        expect(result).toEqual(mockGiftCard);
    });

    it('should return null if no matching gift card is found', async () => {
        const mockQuery = { name: 'Invalid Gift Card' };
        giftCards.findOne.mockResolvedValue(null);

        const result = await findByAnyField(mockQuery);

        expect(result).toBeNull();
    });

    it('should throw an error if database query fails', async () => {
        const mockQuery = { name: 'Amazon Gift Card' };
        const mockError = new Error('Database error');

        giftCards.findOne.mockRejectedValue(mockError);

        await expect(findByAnyField(mockQuery)).rejects.toThrow('Database error');
    });
});
