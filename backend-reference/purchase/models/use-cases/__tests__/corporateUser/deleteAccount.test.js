const corporateUser = require('../../../entities/corporateUser');
const { deleteAccount } = require('../../corporateUser');

// Mock the corporateUser module and its update method
jest.mock('../../../entities/corporateUser', () => ({
  update: jest.fn(), // Mocking the update method explicitly
}));

describe('making the account inactive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update account to inactive', async () => {
    const credentialId = 1;
    const mockUpdateResponse = [1];

    corporateUser.update.mockResolvedValue(mockUpdateResponse);
    console.log = jest.fn();

    const result = await deleteAccount(credentialId);

    expect(corporateUser.update).toHaveBeenCalledWith(
      { isActive: false },
      { where: { credentialId } }
    );
    expect(result).toEqual(mockUpdateResponse);
    expect(console.log).toHaveBeenCalledWith("DELETE ACCOUNT ROUTE CALLED");
  });


  it('should handle when no credentialId is provided', async () => {
    const credentialId = undefined;
    corporateUser.update.mockResolvedValue([0]);
    console.log = jest.fn();

    const result = await deleteAccount(credentialId);

    expect(corporateUser.update).toHaveBeenCalledWith(
      { isActive: false },
      { where: { credentialId: undefined } }
    );
    expect(result).toEqual([0]);
    expect(console.log).toHaveBeenCalledWith("DELETE ACCOUNT ROUTE CALLED");
  });

  it('should always log route call message', async () => {
    const credentialId = 1;
    corporateUser.update.mockResolvedValue([1]);
    console.log = jest.fn();

    await deleteAccount(credentialId);

    expect(console.log).toHaveBeenCalledWith("DELETE ACCOUNT ROUTE CALLED");

    corporateUser.update.mockRejectedValue(new Error('Failed to update'));
    await deleteAccount(credentialId);

    expect(console.log).toHaveBeenCalledWith("DELETE ACCOUNT ROUTE CALLED");
  });
});
