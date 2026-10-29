const { getExcelCSVData } = require('../../../use-cases/giftCards');
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
describe('getExcelCSVData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted gift card data for CSV export', async () => {
        const mockGiftCards = [
            {
                id: 1,
                name: 'Amazon Gift Card',
                priceType: 'Fixed',
                minDenomination: 10,
                maxDenomination: 500,
                currency: 'USD',
            },
            {
                id: 2,
                name: 'Google Play Gift Card',
                priceType: 'Open',
                minDenomination: 5,
                maxDenomination: 100,
                currency: 'EUR',
            }
        ];

        giftCards.findAll.mockResolvedValue(mockGiftCards);

        const result = await getExcelCSVData();

        expect(giftCards.findAll).toHaveBeenCalledWith({
            attributes: ["id", "name", "priceType", "minDenomination", "maxDenomination", "currency"],
            order: [["createdAt", "DESC"]],
            raw: true,
        });
        expect(result).toEqual([
            {
                "GiftCard Id": 1,
                "GiftCard Name": "Amazon Gift Card",
                "Price Type": "Fixed",
                "Price Range": "Min: 10 - Max: 500",
                "Currency": "USD",
            },
            {
                "GiftCard Id": 2,
                "GiftCard Name": "Google Play Gift Card",
                "Price Type": "Open",
                "Price Range": "Min: 5 - Max: 100",
                "Currency": "EUR",
            }
        ]);
    });

    it('should return an empty array if no gift cards exist', async () => {
        giftCards.findAll.mockResolvedValue([]);

        const result = await getExcelCSVData();

        expect(result).toEqual([]);
    });

    it('should handle errors if database query fails', async () => {
        const mockError = new Error('Database error');

        giftCards.findAll.mockRejectedValue(mockError);

        await expect(getExcelCSVData()).rejects.toThrow('Database error');
    });
});
