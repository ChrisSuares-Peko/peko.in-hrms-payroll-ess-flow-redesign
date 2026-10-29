const { findAllSavedCards } = require('../../../use-cases/savedCards'); // Adjust path as needed
const SavedCards = require('../../../entities/savedCards'); 
jest.mock('../../../entities/savedCards', () => ({
    findAll: jest.fn(),
}));



describe('findAllSavedCards', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all saved cards for a user', async () => {
        const mockCorporateId = 123;
        const mockCards = [
            {
                id: 1,
                maskedPan: 'XXXX-XXXX-XXXX-1234',
                expiry: '12/24',
                scheme: 'Visa',
                cardholderName: 'John Doe',
                is_default: true,
            },
            {
                id: 2,
                maskedPan: 'XXXX-XXXX-XXXX-5678',
                expiry: '01/25',
                scheme: 'Mastercard',
                cardholderName: 'John Doe',
                is_default: false,
            },
        ];

        SavedCards.findAll.mockResolvedValue(mockCards);

        const result = await findAllSavedCards(mockCorporateId);

        expect(SavedCards.findAll).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockCorporateId,
            },
            attributes: [
                "id",
                "maskedPan",
                "expiry",
                "scheme",
                "cardholderName",
                "is_default",
            ],
            raw: true,
            nest: true,
            order: [["is_default", "DESC"]],
        });

        const expectedResult = mockCards.map(card => ({
            ...card,
            is_default: !!card.is_default // Ensure boolean
        }));
        expect(result).toEqual(expectedResult);
    });

    it('should return an empty array if no saved cards are found for the user', async () => {
        const mockCorporateId = 123;
        SavedCards.findAll.mockResolvedValue([]);

        const result = await findAllSavedCards(mockCorporateId);

        expect(SavedCards.findAll).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockCorporateId,
            },
            attributes: [
                "id",
                "maskedPan",
                "expiry",
                "scheme",
                "cardholderName",
                "is_default",
            ],
            raw: true,
            nest: true,
            order: [["is_default", "DESC"]],
        });
        expect(result).toEqual([]);
    });

    it('should handle errors during database query and return false', async () => {
        const mockCorporateId = 123;
        const mockError = new Error('Database error');

        SavedCards.findAll.mockRejectedValue(mockError);
        const consoleErrorSpy = jest.spyOn(console, 'error');

        const result = await findAllSavedCards(mockCorporateId);

         expect(SavedCards.findAll).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockCorporateId,
            },
            attributes: [
                "id",
                "maskedPan",
                "expiry",
                "scheme",
                "cardholderName",
                "is_default",
            ],
            raw: true,
            nest: true,
            order: [["is_default", "DESC"]],
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
        expect(result).toBe(false);
        consoleErrorSpy.mockRestore();
    });

    it('should return false if findAll returns null', async () => {
      const mockCorporateId = 123;
      SavedCards.findAll.mockResolvedValue(null);

      const result = await findAllSavedCards(mockCorporateId);

      expect(SavedCards.findAll).toHaveBeenCalledWith({
          where: {
              corporateUserId: mockCorporateId,
          },
          attributes: [
              "id",
              "maskedPan",
              "expiry",
              "scheme",
              "cardholderName",
              "is_default",
          ],
          raw: true,
          nest: true,
          order: [["is_default", "DESC"]],
      });
      expect(result).toBe(false);
  });
});