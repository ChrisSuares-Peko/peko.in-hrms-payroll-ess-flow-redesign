const { updatePasswordPolicy } = require('../../passwordPolicy');
const passwordPolicy = require('../../../entities/passwordPolicy');

jest.mock('../../../entities/passwordPolicy', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

describe('updatePasswordPolicy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update an existing password policy successfully', async () => {
    const mockUpdateData = { minLength: 10 };
    const mockId = 1;
    const mockPolicy = {
      id: mockId,
      minLength: 8,
      update: jest.fn().mockResolvedValue(true),
      dataValues: { id: mockId, minLength: 10 },
    };

    passwordPolicy.findOne.mockResolvedValue(mockPolicy);

    const result = await updatePasswordPolicy(mockUpdateData, mockId);

    expect(passwordPolicy.findOne).toHaveBeenCalledWith({ where: { id: mockId } });
    expect(mockPolicy.update).toHaveBeenCalledWith(mockUpdateData);
    expect(result).toEqual({ id: mockId, minLength: 10 });
  });

  it('should create a new password policy if id is "0"', async () => {
    const mockUpdateData = { minLength: 12, maxPasswordAge: 90 };
    const mockId = "0";
    const mockNewPolicy = {
      id: 2,
      minLength: 12,
      maxPasswordAge: 90,
      dataValues: { id: 2, minLength: 12, maxPasswordAge: 90 },
    };

    passwordPolicy.findOne.mockResolvedValue(null);
    passwordPolicy.create.mockResolvedValue(mockNewPolicy);

    const result = await updatePasswordPolicy(mockUpdateData, mockId);

    expect(passwordPolicy.findOne).toHaveBeenCalledWith({ where: { id: mockId } });
    expect(passwordPolicy.create).toHaveBeenCalledWith(mockUpdateData);
    expect(result).toEqual({ id: 2, minLength: 12, maxPasswordAge: 90 });
  });

  it('should throw an error if the password policy is not found and id is not "0"', async () => {
    const mockUpdateData = { minLength: 10 };
    const mockId = 99;

    passwordPolicy.findOne.mockResolvedValue(null);

    await expect(updatePasswordPolicy(mockUpdateData, mockId)).rejects.toThrow(
      'Password policy not found.'
    );

    expect(passwordPolicy.findOne).toHaveBeenCalledWith({ where: { id: mockId } });
    expect(passwordPolicy.create).not.toHaveBeenCalled();
  });

  it('should handle unexpected errors gracefully', async () => {
    const mockUpdateData = { minLength: 10 };
    const mockId = 1;
    const mockError = new Error('Database error');

    passwordPolicy.findOne.mockRejectedValue(mockError);

    await expect(updatePasswordPolicy(mockUpdateData, mockId)).rejects.toThrow('Database error');

    expect(passwordPolicy.findOne).toHaveBeenCalledWith({ where: { id: mockId } });
    expect(passwordPolicy.create).not.toHaveBeenCalled();
  });
});
