const { changeDefaultCard } = require('../../../use-cases/savedCards');
const SavedCards = require('../../../entities/savedCards'); 

jest.mock('../../../entities/savedCards', () => ({
    update: jest.fn(),
}));


describe('changeDefaultCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully change the default card', async () => {
        const mockCorporateId = 123;
        const mockCardId = 456;

        SavedCards.update.mockResolvedValue([1]); 

        const result = await changeDefaultCard({ corporateId: mockCorporateId, cardId: mockCardId });

        expect(SavedCards.update).toHaveBeenCalledTimes(2); // Two updates: remove old, set new
        expect(SavedCards.update).toHaveBeenNthCalledWith(1, { is_default: false }, {
            where: { is_default: true, corporateUserId: mockCorporateId },
        });
        expect(SavedCards.update).toHaveBeenNthCalledWith(2, { is_default: true }, {
            where: { id: mockCardId, corporateUserId: mockCorporateId },
        });
        expect(result).toBe(true);
    });

    it('should handle the case where no previous default card exists', async () => {
        const mockCorporateId = 123;
        const mockCardId = 456;

        SavedCards.update.mockResolvedValueOnce([0]); // No previous default card
        SavedCards.update.mockResolvedValueOnce([1]); // New default card set

        const result = await changeDefaultCard({ corporateId: mockCorporateId, cardId: mockCardId });

        expect(SavedCards.update).toHaveBeenCalledTimes(2);
        expect(result).toBe(true); // Still considered a success if the desired card is set as default.
    });

    it('should handle the case where the specified card is not found', async () => {
        const mockCorporateId = 123;
        const mockCardId = 456;

        SavedCards.update.mockResolvedValueOnce([1]); // Previous default removed
        SavedCards.update.mockResolvedValueOnce([0]); // Specified card not found

        const result = await changeDefaultCard({ corporateId: mockCorporateId, cardId: mockCardId });

        expect(SavedCards.update).toHaveBeenCalledTimes(2);
        expect(result).toBe(false); // Should return false if the target card isn't found.
    });

    it('should handle errors during database operations', async () => {
        const mockCorporateId = 123;
        const mockCardId = 456;
        const mockError = new Error('Database error');

        SavedCards.update.mockRejectedValue(mockError); // Simulate error

        const consoleErrorSpy = jest.spyOn(console, 'error');

        const result = await changeDefaultCard({ corporateId: mockCorporateId, cardId: mockCardId });

        expect(SavedCards.update).toHaveBeenCalled(); // Check that update was called
        expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
        expect(result).toBe(false);

        consoleErrorSpy.mockRestore();
    });

    it('should handle missing parameters', async () => {
      const result1 = await changeDefaultCard({ corporateId: 123 }); 
      const result2 = await changeDefaultCard({ cardId: 456 }); 
      const result3 = await changeDefaultCard({}); 
      expect(result1).toBe(false); 
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });
});