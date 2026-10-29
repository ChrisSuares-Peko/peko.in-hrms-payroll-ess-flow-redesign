const { update } = require('../../../use-cases/giftCards');
const giftCards = require('../../../entities/giftCards');

jest.mock('../../../entities/giftCards', () => ({
    update: jest.fn(),
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
describe('update', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update a gift card successfully', async () => {
        const mockId = 1;
        const mockParams = { name: 'Updated Gift Card', brand_logo: 'logo.png' };
        const mockUpdateResponse = [1];

        giftCards.update.mockResolvedValue(mockUpdateResponse);

        const result = await update(mockId, mockParams);

      
        expect(giftCards.update).toHaveBeenCalledWith(mockParams, {
            where: { id: mockId },
        });
        expect(result).toEqual(mockUpdateResponse);
    });

    it('should return false if no gift card is updated', async () => {
        const mockId = 1;
        const mockParams = { name: 'Updated Gift Card', brand_logo: 'logo.png' };
        const mockUpdateResponse = [0];

        
        giftCards.update.mockResolvedValue(mockUpdateResponse);

        const result = await update(mockId, mockParams);

        expect(result).toEqual(mockUpdateResponse);
    });

    it('should handle errors if update operation fails', async () => {
        const mockId = 1;
        const mockParams = { name: 'Updated Gift Card', brand_logo: 'logo.png' };
        const mockError = new Error('Database error');

       
        giftCards.update.mockRejectedValue(mockError);

        await expect(update(mockId, mockParams)).rejects.toThrow('Database error');
    });
});