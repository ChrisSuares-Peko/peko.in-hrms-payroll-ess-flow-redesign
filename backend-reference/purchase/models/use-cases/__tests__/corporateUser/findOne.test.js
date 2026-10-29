const corporateUser = require('../../../entities/corporateUser');
const packAge = require('../../../entities/package');
const credential = require('../../../entities/credential');
const { findOne } = require('../../corporateUser');

/**
 * Mock Sequelize models
 */
jest.mock('../../../entities/corporateUser', () => ({
  findOne: jest.fn(),
  belongsTo: jest.fn(),
}));

jest.mock('../../../entities/package', () => ({}));

jest.mock('../../../entities/credential', () => ({}));

describe('find corporate user', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully retrieve a corporate user with no attributes specified', async () => {
    const params = { corporateId: 1 };
    const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };

    corporateUser.findOne.mockResolvedValue(mockUser);

    const result = await findOne(params);

    expect(corporateUser.findOne).toHaveBeenCalledTimes(1);

    const callArgs = corporateUser.findOne.mock.calls[0][0];

    expect(callArgs.where).toEqual({ credentialId: 1 });
    expect(callArgs.attributes).toBeUndefined();
    expect(callArgs.nest).toBe(true);
    expect(callArgs.raw).toBe(true);

    expect(callArgs.include).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ model: packAge }),
        expect.objectContaining({
          model: credential,
          attributes: ['username'],
        }),
      ])
    );

    expect(result).toEqual(mockUser);
  });

  it('should successfully retrieve a corporate user with specific attributes', async () => {
    const params = { corporateId: 1 };
    const attributes = ['name', 'email'];
    const mockUser = { name: 'John Doe', email: 'john@example.com' };

    corporateUser.findOne.mockResolvedValue(mockUser);

    const result = await findOne(params, attributes);

    const callArgs = corporateUser.findOne.mock.calls[0][0];

    expect(callArgs.where).toEqual({ credentialId: 1 });
    expect(callArgs.attributes).toEqual(attributes);

    expect(callArgs.include).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ model: packAge }),
        expect.objectContaining({
          model: credential,
          attributes: ['username'],
        }),
      ])
    );

    expect(result).toEqual(mockUser);
  });

  it('should return null when no corporate user is found', async () => {
    const params = { corporateId: 1 };

    corporateUser.findOne.mockResolvedValue(null);

    const result = await findOne(params);

    expect(corporateUser.findOne).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });

  it('should throw error when corporateUser.findOne throws', async () => {
    const params = { corporateId: 1 };
    const error = new Error('Database error');

    corporateUser.findOne.mockRejectedValue(error);

    await expect(findOne(params)).rejects.toThrow('Database error');
  });

  it('should handle attributes explicitly set to undefined', async () => {
    const params = { corporateId: 1 };
    const mockUser = { id: 1, name: 'John Doe' };

    corporateUser.findOne.mockResolvedValue(mockUser);

    const result = await findOne(params, undefined);

    const callArgs = corporateUser.findOne.mock.calls[0][0];

    expect(callArgs.attributes).toBeUndefined();
    expect(result).toEqual(mockUser);
  });

  it('should throw TypeError when params is undefined', async () => {
    const attributes = ['name', 'email'];

    await expect(findOne(undefined, attributes)).rejects.toThrow(TypeError);
  });

  it('should handle empty params object', async () => {
    const params = {};
    const attributes = ['name', 'email'];

    corporateUser.findOne.mockResolvedValue(null);

    const result = await findOne(params, attributes);

    const callArgs = corporateUser.findOne.mock.calls[0][0];

    // IMPORTANT: Sequelize keeps undefined values
    expect(callArgs.where).toEqual({ credentialId: undefined });
    expect(callArgs.attributes).toEqual(attributes);

    expect(callArgs.include).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ model: packAge }),
        expect.objectContaining({
          model: credential,
          attributes: ['username'],
        }),
      ])
    );

    expect(result).toBeNull();
  });
});
