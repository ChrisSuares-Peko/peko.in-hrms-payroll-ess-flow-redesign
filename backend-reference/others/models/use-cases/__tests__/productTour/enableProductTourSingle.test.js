const { enableProductTourSingle } = require('../../productTour');
const corporateUser = require('../../../entities/corporateUser');
const sequelize = require('../../../../configs/database/index');

jest.mock('../../../entities/corporateUser', () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));

// Override sequelize.transaction to return a consistent transaction object.
jest.mock('../../../../configs/database/index', () => ({
  transaction: jest.fn(),
}));

describe('enableProductTourSingle', () => {
  let transaction;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a transaction object with commit and rollback mocks.
    transaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };
    // Ensure that sequelize.transaction resolves to our transaction object.
    sequelize.transaction.mockResolvedValue(transaction);
  });

  it('should set the specified service to false and return updated data', async () => {
    const id = 123;
    const service = 'feature1';
    const mockUser = { productTour: { feature1: true, feature2: true } };
    const mockUpdatedUser = { productTour: { feature1: false, feature2: true } };

    // First call to findOne returns the current user; second call returns updated user.
    corporateUser.findOne
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce(mockUpdatedUser);
    // Simulate successful update by returning a truthy value.
    corporateUser.update.mockResolvedValue(1);

    const result = await enableProductTourSingle(id, service);

    // Expect findOne to have been called twice with the transaction.
    expect(corporateUser.findOne).toHaveBeenCalledTimes(2);
    expect(corporateUser.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { credentialId: id },
        attributes: ["productTour"],
        transaction,
      })
    );
    // Expect update to have been called with updated productTour.
    expect(corporateUser.update).toHaveBeenCalledWith(
      { productTour: { feature1: false, feature2: true } },
      { where: { credentialId: id }, transaction }
    );
    // Expect the transaction to be committed.
    expect(transaction.commit).toHaveBeenCalled();
    // And the function returns the updated user data.
    expect(result).toEqual(mockUpdatedUser);
  });

  it('should return false if no rows are updated', async () => {
    const id = 123;
    const service = 'feature1';
    const mockUser = { productTour: { feature1: true } };

    // Simulate findOne call.
    corporateUser.findOne.mockResolvedValue(mockUser);
    // Simulate update returning a falsy value (e.g. false) to indicate no rows updated.
    corporateUser.update.mockResolvedValue(false);

    const result = await enableProductTourSingle(id, service);

    // Function should return false.
    expect(result).toBe(false);
    // In this branch, commit is not reached.
    expect(transaction.commit).not.toHaveBeenCalled();
  });

  it('should rollback transaction and throw an error if an exception occurs', async () => {
    const id = 123;
    const service = 'feature1';
    const mockError = new Error('Database error');

    // Simulate an error in the first findOne call.
    corporateUser.findOne.mockRejectedValue(mockError);

    await expect(enableProductTourSingle(id, service)).rejects.toThrow('Database error');
    // Expect the transaction to be rolled back.
    expect(transaction.rollback).toHaveBeenCalled();
    expect(transaction.commit).not.toHaveBeenCalled();
  });
});
