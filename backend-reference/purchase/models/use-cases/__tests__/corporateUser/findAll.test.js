const { fetchAllCorporates } = require('../../corporateUser');
const corporateUser = require('../../../entities/corporateUser');
const credential = require('../../../entities/credential');
const { Op } = require('sequelize');

// Mocking the corporateUser and credential models
jest.mock('../../../entities/corporateUser', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({
  findOne: jest.fn(),
}));

describe('fetchAllCorporates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully retrieve data with valid query and partnerId', async () => {
    const query = 'test';
    const partnerId = 1;
    const mockResult = [{ id: 1, name: 'Test Corp', registeredBy: partnerId }];
    corporateUser.findAll.mockResolvedValue(mockResult);

    const result = await fetchAllCorporates(query, partnerId);

    expect(result).toEqual(mockResult);
    expect(corporateUser.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: credential,
          where: {
            registeredBy: partnerId,
            name: { [Op.like]: `%${query}%` },
          },
        },
      ],
      raw: true,
      nest: true,
    });
  });

  it('should return an empty array if no records match the query and partnerId', async () => {
    const query = 'nonexistent';
    const partnerId = 1;
    corporateUser.findAll.mockResolvedValue([]);

    const result = await fetchAllCorporates(query, partnerId);

    expect(result).toEqual([]);
    expect(corporateUser.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: credential,
          where: {
            registeredBy: partnerId,
            name: { [Op.like]: `%${query}%` },
          },
        },
      ],
      raw: true,
      nest: true,
    });
  });

  it('should handle an empty query string', async () => {
    const query = '';
    const partnerId = 1;
    const mockResult = [{ id: 1, name: 'Test Corp', registeredBy: partnerId }];
    corporateUser.findAll.mockResolvedValue(mockResult);

    const result = await fetchAllCorporates(query, partnerId);

    expect(result).toEqual(mockResult);
    expect(corporateUser.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: credential,
          where: {
            registeredBy: partnerId,
            name: { [Op.like]: `%${query}%` },
          },
        },
      ],
      raw: true,
      nest: true,
    });
  });

  it('should handle an invalid or null partnerId gracefully', async () => {
    const query = 'test';
    const partnerId = null;
    const mockResult = [];
    corporateUser.findAll.mockResolvedValue(mockResult);

    const result = await fetchAllCorporates(query, partnerId);

    expect(result).toEqual(mockResult);
    expect(corporateUser.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: credential,
          where: {
            registeredBy: partnerId,
            name: { [Op.like]: `%${query}%` },
          },
        },
      ],
      raw: true,
      nest: true,
    });
  });

  it('should handle database errors gracefully', async () => {
    const query = 'test';
    const partnerId = 1;
    const errorMessage = 'Database connection error';
    corporateUser.findAll.mockRejectedValue(new Error(errorMessage));

    await expect(fetchAllCorporates(query, partnerId)).rejects.toThrow(errorMessage);
    expect(corporateUser.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: credential,
          where: {
            registeredBy: partnerId,
            name: { [Op.like]: `%${query}%` },
          },
        },
      ],
      raw: true,
      nest: true,
    });
  });
});
