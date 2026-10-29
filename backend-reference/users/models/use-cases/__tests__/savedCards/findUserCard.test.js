const { findUserCard } = require('../../../use-cases/savedCards'); // Adjust path as needed
const SavedCards = require('../../../entities/savedCards'); 

jest.mock('../../../entities/savedCards', () => ({
    findOne: jest.fn(),
}));


describe('findUserCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the user\'s default card details when found', async () => {
        const mockCorporateId = 123;
        const mockCardDetails = {
            maskedPan: 'XXXX-XXXX-XXXX-1234',
            expiry: '12/24',
            scheme: 'Visa',
        };

        SavedCards.findOne.mockResolvedValue(mockCardDetails);

        const result = await findUserCard({ corporateId: mockCorporateId }); // Pass params as object

        expect(SavedCards.findOne).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockCorporateId,
                is_default: true,
            },
            attributes: ["maskedPan", "expiry", "scheme"],
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockCardDetails);
    });

    it('should return null when no default card is found for the user', async () => {
      const mockCorporateId = 123;
      SavedCards.findOne.mockResolvedValue(null);

      const result = await findUserCard({ corporateId: mockCorporateId });

      expect(SavedCards.findOne).toHaveBeenCalledWith({
          where: {
              corporateUserId: mockCorporateId,
              is_default: true,
          },
          attributes: ["maskedPan", "expiry", "scheme"],
          raw: true,
          nest: true,
      });
      expect(result).toBeNull();
  });

    it('should handle errors during database query and return false', async () => {
        const mockCorporateId = 123;
        const mockError = new Error('Database error');

        SavedCards.findOne.mockRejectedValue(mockError);

        const consoleErrorSpy = jest.spyOn(console, 'error'); // Spy on console.error

        const result = await findUserCard({ corporateId: mockCorporateId });

        expect(SavedCards.findOne).toHaveBeenCalledWith({
            where: {
                corporateUserId: mockCorporateId,
                is_default: true,
            },
            attributes: ["maskedPan", "expiry", "scheme"],
            raw: true,
            nest: true,
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching permissions:", mockError);
        expect(result).toBe(false);

        consoleErrorSpy.mockRestore(); // Restore console.error
    });

    it('should handle missing corporateId in params', async () => {
      const result = await findUserCard({}); // Missing corporateId

     
      expect(result).toBe(false); // Or throw an error, depending on your requirements.
    });
});