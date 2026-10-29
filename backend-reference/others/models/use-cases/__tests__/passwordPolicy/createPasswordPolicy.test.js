const { createPasswordPolicy } = require('../../passwordPolicy');
const passwordPolicy = require('../../../entities/passwordPolicy');

jest.mock('../../../entities/passwordPolicy', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

describe('createPasswordPolicy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a password policy successfully', async () => {
    const mockPolicyData = {
      level: 'High',
      minLength: 8,
      minPasswordAge: 1,
      maxPasswordAge: 90,
      minChangeChars: 2,
      prohibitPasswordReuse: true,
      prohibitPasswordReuseTimes: 3,
    };

    passwordPolicy.findOne.mockResolvedValue(null); // No existing policy
    const mockNewPolicy = { id: 1, ...mockPolicyData };
    passwordPolicy.create.mockResolvedValue(mockNewPolicy);

    const result = await createPasswordPolicy(mockPolicyData);

    expect(passwordPolicy.findOne).toHaveBeenCalledTimes(1);
    expect(passwordPolicy.create).toHaveBeenCalledWith(mockPolicyData);
    expect(result).toEqual({
      status: true,
      message: 'Password policy created successfully',
      data: mockNewPolicy,
    });
  });

  it('should return an error if a password policy already exists', async () => {
    const mockPolicyData = {
      level: 'High',
      minLength: 8,
      minPasswordAge: 1,
      maxPasswordAge: 90,
      minChangeChars: 2,
      prohibitPasswordReuse: true,
      prohibitPasswordReuseTimes: 3,
    };

    passwordPolicy.findOne.mockResolvedValue({ id: 1 }); // Existing policy found

    const result = await createPasswordPolicy(mockPolicyData);

    expect(passwordPolicy.findOne).toHaveBeenCalledTimes(1);
    expect(passwordPolicy.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: false,
      message: 'Password policy already exists',
      data: {},
    });
  });

  it('should return an error if policy data is invalid', async () => {
    const mockPolicyData = null;

    const result = await createPasswordPolicy(mockPolicyData);

    expect(passwordPolicy.findOne).not.toHaveBeenCalled();
    expect(passwordPolicy.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: false,
      message: 'Invalid policy data',
      data: {},
    });
  });

  it('should handle unexpected errors gracefully', async () => {
    const mockPolicyData = {
      level: 'Medium',
      minLength: 6,
      minPasswordAge: 1,
      maxPasswordAge: 60,
      minChangeChars: 2,
      prohibitPasswordReuse: false,
      prohibitPasswordReuseTimes: 0,
    };

    const mockError = new Error('Database error');

    passwordPolicy.findOne.mockRejectedValue(mockError);

    const result = await createPasswordPolicy(mockPolicyData);

    expect(passwordPolicy.findOne).toHaveBeenCalledTimes(1);
    expect(passwordPolicy.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: false,
      message: 'Database error',
      data: {},
    });
  });
});
