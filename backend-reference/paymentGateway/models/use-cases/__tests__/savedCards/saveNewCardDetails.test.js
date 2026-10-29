const { saveNewCardDetails } = require('../../savedCards');
const SavedCards = require('../../../entities/savedCards');

jest.mock('../../../entities/savedCards', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

describe('saveNewCardDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return undefined if card already exists', async () => {
    const mockParams = { cardToken: 'TOKEN123', corporateUserId: 'USER1' };
    SavedCards.findOne.mockResolvedValueOnce({ id: 1 }); // existing card found

    const result = await saveNewCardDetails(mockParams);

    expect(result).toBeUndefined();
    expect(SavedCards.create).not.toHaveBeenCalled();
  });

  it('should create card with is_default=true if no default card exists', async () => {
    const mockParams = { cardToken: 'TOKEN123', corporateUserId: 'USER1' };
    SavedCards.findOne
      .mockResolvedValueOnce(null)  // no existing card
      .mockResolvedValueOnce(null); // no default card

    const mockCreated = { id: 1, ...mockParams, is_default: true };
    SavedCards.create.mockResolvedValue(mockCreated);

    const result = await saveNewCardDetails(mockParams);

    expect(SavedCards.create).toHaveBeenCalledWith({ ...mockParams, is_default: true });
    expect(result).toEqual(mockCreated);
  });

  it('should create card with is_default=false if default card already exists', async () => {
    const mockParams = { cardToken: 'TOKEN_NEW', corporateUserId: 'USER1' };
    SavedCards.findOne
      .mockResolvedValueOnce(null)                    // no existing card with token
      .mockResolvedValueOnce({ id: 2, is_default: true }); // default card exists

    const mockCreated = { id: 3, ...mockParams, is_default: false };
    SavedCards.create.mockResolvedValue(mockCreated);

    const result = await saveNewCardDetails(mockParams);

    expect(SavedCards.create).toHaveBeenCalledWith({ ...mockParams, is_default: false });
    expect(result).toEqual(mockCreated);
  });

  it('should throw error when DB fails', async () => {
    SavedCards.findOne.mockRejectedValue(new Error('DB Error'));

    await expect(saveNewCardDetails({ cardToken: 'T', corporateUserId: 'U' })).rejects.toThrow('DB Error');
  });
});
