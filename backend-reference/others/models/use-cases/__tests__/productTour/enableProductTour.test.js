const { enableProductTour } = require('../../productTour');
const corporateUser = require('../../../entities/corporateUser');
const sequelize = require('../../../../configs/database/index');

jest.mock('../../../entities/corporateUser', () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../../../configs/database/index', () => ({
  transaction: jest.fn(() => ({
    commit: jest.fn(),
    rollback: jest.fn(),
  })),
}));

describe('enableProductTour', () => {
  let transaction;

  beforeEach(() => {
    transaction = sequelize.transaction(); // Initialize the mocked transaction
    jest.clearAllMocks();
  });

  it('should enable product tour for all features and return updated data', async () => {
    const mockId = 1;
    const mockProductTour = { feature1: false, feature2: false };
    const updatedProductTour = { feature1: true, feature2: true };
    const mockUser = { productTour: mockProductTour };
    const mockUpdatedUser = { productTour: updatedProductTour };

    corporateUser.findOne
      .mockResolvedValueOnce(mockUser) // First call for the user
      .mockResolvedValueOnce(mockUpdatedUser); // Second call for updated user

    corporateUser.update.mockResolvedValue([1]); // Indicating one row updated

    const result = await enableProductTour(mockId);

    // Assert findOne was called twice
    expect(corporateUser.findOne).toHaveBeenCalledTimes(2);
   
    expect(result).toEqual(mockUpdatedUser);
  });

  it('should return false if no rows are updated', async () => {
    const mockId = 1;
    const mockProductTour = { feature1: false };
    const mockUser = { productTour: mockProductTour };
  
    // First call to get the user
    corporateUser.findOne.mockResolvedValueOnce(mockUser);
    // Simulate update returning 0 (falsy) indicating no rows updated.
    corporateUser.update.mockResolvedValue(0);
  
    const result = await enableProductTour(mockId);
  
    expect(corporateUser.update).toHaveBeenCalled();
    expect(transaction.commit).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });
  

  it('should rollback transaction and throw an error if an exception occurs', async () => {
    const mockId = 1;
    const mockError = new Error('Database error');

    corporateUser.findOne.mockRejectedValue(mockError);

    await expect(enableProductTour(mockId)).rejects.toThrow('Database error');

   
  });
});
