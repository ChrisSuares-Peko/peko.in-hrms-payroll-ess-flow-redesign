const { findAllPasswordPolicies } = require('../../passwordPolicy');
const passwordPolicy = require('../../../entities/passwordPolicy');

jest.mock('../../../entities/passwordPolicy', () => ({
  findAll: jest.fn(),
}));

describe('findAllPasswordPolicies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all password policies successfully', async () => {
    const mockPolicies = [
      { id: 1, minLength: 8, maxPasswordAge: 90 },
      { id: 2, minLength: 10, maxPasswordAge: 60 },
    ];

    passwordPolicy.findAll.mockResolvedValue(mockPolicies);

    const result = await findAllPasswordPolicies();

    expect(passwordPolicy.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockPolicies);
  });

  it('should return an empty array if no policies are found', async () => {
    passwordPolicy.findAll.mockResolvedValue([]);

    const result = await findAllPasswordPolicies();

    expect(passwordPolicy.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Database error');
    passwordPolicy.findAll.mockRejectedValue(mockError);

    await expect(findAllPasswordPolicies()).rejects.toThrow('Database error');
    expect(passwordPolicy.findAll).toHaveBeenCalledTimes(1);
  });
});
