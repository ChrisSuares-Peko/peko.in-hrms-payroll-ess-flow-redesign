const { giftCardsAndCountExport } = require('../../../use-cases/giftCards');
const giftCards = require('../../../entities/giftCards');
const { handleSortFields } = require('../../../../utils/sortHandle');
const { formattedDateTime } = require('../../../../utils/formatter');

jest.mock('../../../entities/giftCards', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));

jest.mock('../../../../utils/formatter', () => ({
    formattedDateTime: jest.fn(),
}));
jest.mock("@logtail/node", () => ({
    Logtail: jest.fn().mockImplementation(() => ({
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));
describe('giftCardsAndCountExport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted gift card data for export', async () => {
        const mockParams = { searchText: 'Amazon', sort: 'ASC', sortField: 'product_name' };
        const mockOrder = [['product_name', 'ASC']];
        const mockGiftCards = {
            count: 2,
            rows: [
                {
                    id: 1,
                    product_name: 'Amazon Gift Card',
                    is_open_denominnation: true,
                    min_price: 10,
                    max_price: 500,
                    currency: 'USD',
                    status: true,
                    createdAt: new Date('2023-01-01T00:00:00Z')
                },
                {
                    id: 2,
                    product_name: 'Google Play Gift Card',
                    is_open_denominnation: false,
                    min_price: 5,
                    max_price: 100,
                    currency: 'EUR',
                    status: false,
                    createdAt: new Date('2023-02-01T00:00:00Z')
                }
            ]
        };

        handleSortFields.mockReturnValue(mockOrder);
        formattedDateTime.mockImplementation(date => date.toISOString());
        giftCards.findAndCountAll.mockResolvedValue(mockGiftCards);

        const result = await giftCardsAndCountExport(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
        expect(giftCards.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.any(Object),
            order: mockOrder,
        }));
       expect(result).toEqual([
    {
        Date: '2023-01-01T00:00:00.000Z',
        Name: 'Amazon Gift Card',
        "Price Type": "Open",
        "Price Range": "Min: 10 - Max: 500",
        Expiry: "Not Available",
        Status: "Active"
    },
    {
        Date: '2023-02-01T00:00:00.000Z',
        Name: 'Google Play Gift Card',
        "Price Type": "Fixed",
        "Price Range": "Denominations: (undefined)", // because your mock has no denominations field
        Expiry: "Not Available",
        Status: "In Active"
    }
]);

    });

    it('should return an empty array if no gift cards match the search criteria', async () => {
        const mockParams = { searchText: 'Invalid' };
        giftCards.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await giftCardsAndCountExport(mockParams);

        expect(result).toEqual([]);
    });

    it("should handle errors if database query fails", async () => {
        const mockError = { message: "Something went wrong" }; // Match the function's thrown object
        giftCards.findAndCountAll.mockRejectedValue(mockError);
    
        await expect(giftCardsAndCountExport({})).rejects.toEqual(mockError); // ✅ This works!
    });
    
});
