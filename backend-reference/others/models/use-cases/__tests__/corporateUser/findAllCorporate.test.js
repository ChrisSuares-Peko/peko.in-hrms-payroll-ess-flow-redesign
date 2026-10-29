const { findAllCorporate } = require('../../corporateUser');
const corporateUser = require('../../../entities/corporateUser');

jest.mock('../../../entities/corporateUser');

describe('findAllCorporate Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully retrieve all corporate users', async () => {
    const mockCorporateData = [
      {
        email: 'test1@example.com',
        name: 'Test Corp 1',
        registeredBy: 123,
      },
      {
        email: 'test2@example.com',
        name: 'Test Corp 2',
        registeredBy: 456,
      },
    ];

    corporateUser.findAll = jest.fn().mockResolvedValue(mockCorporateData);

    const result = await findAllCorporate();

    expect(result).toEqual(mockCorporateData);
    expect(corporateUser.findAll).toHaveBeenCalledWith({
      attributes: ["email", "name", "registeredBy"],
      raw: true,
    });
  });

  it('should handle no corporate users', async () => {
    corporateUser.findAll = jest.fn().mockResolvedValue([]);

    const result = await findAllCorporate();

    expect(result).toEqual([]);
    expect(corporateUser.findAll).toHaveBeenCalledWith({
      attributes: ["email", "name", "registeredBy"],
      raw: true,
    });
  });

  it('should throw an error if the database query fails', async () => {
    corporateUser.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

    await expect(findAllCorporate()).rejects.toEqual(new Error('Database error'));
  });
});
