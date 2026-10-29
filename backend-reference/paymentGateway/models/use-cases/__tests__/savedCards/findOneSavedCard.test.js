const { findOneSavedCard } = require('../../../use-cases/savedCards'); // Adjust path
const SavedCards = require('../../../entities/savedCards'); 

jest.mock('../../../entities/savedCards', () => ({
    findOne: jest.fn(),
}));

describe('findOneSavedCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the saved card when found and is_default is true', async () => {
        const mockParams = { userId: 1 };
        const mockCard = {
            userId: 1,
            cardNumber: '1234567890',
            expiryMonth: '12',
            expiryYear: '2025',
            cvc: '123',
            cardType: 'VISA',
        };

        SavedCards.findOne.mockResolvedValue(mockCard);

        const result = await findOneSavedCard(mockParams);

        expect(SavedCards.findOne).toHaveBeenCalledWith({
            where: { ...mockParams, is_default: true },
            attributes: { exclude: ['is_default', 'createdAt', 'updatedAt', 'id'] },
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockCard);
    });

    it('should return null when no saved card is found', async () => {
        const mockParams = { userId: 1 };

        SavedCards.findOne.mockResolvedValue(null);

        const result = await findOneSavedCard(mockParams);

        expect(SavedCards.findOne).toHaveBeenCalledWith({
            where: { ...mockParams, is_default: true },
            attributes: { exclude: ['is_default', 'createdAt', 'updatedAt', 'id'] },
            raw: true,
            nest: true,
        });
        expect(result).toBeNull();
    });

    it('should return null when no saved card is found with matching params', async () => {
      const mockParams = { userId: 1, cardNumber: '456456456456' };

      SavedCards.findOne.mockResolvedValue(null);

      const result = await findOneSavedCard(mockParams);

      expect(SavedCards.findOne).toHaveBeenCalledWith({
          where: { ...mockParams, is_default: true },
          attributes: { exclude: ['is_default', 'createdAt', 'updatedAt', 'id'] },
          raw: true,
          nest: true,
      });
      expect(result).toBeNull();
  });


    it('should handle errors during database operations', async () => {
        const mockParams = { userId: 1 };
        const mockError = new Error('Database error');

        SavedCards.findOne.mockRejectedValue(mockError);

        await expect(findOneSavedCard(mockParams)).rejects.toThrow(mockError); // Or handle the error as you prefer

        expect(SavedCards.findOne).toHaveBeenCalledWith({
            where: { ...mockParams, is_default: true },
            attributes: { exclude: ['is_default', 'createdAt', 'updatedAt', 'id'] },
            raw: true,
            nest: true,
        });
    });

   
});