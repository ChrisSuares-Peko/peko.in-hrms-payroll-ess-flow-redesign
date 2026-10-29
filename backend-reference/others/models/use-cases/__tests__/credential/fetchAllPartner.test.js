const { fetchAllPartner } = require('../../credential');
const credential = require('../../../entities/credential');
jest.mock('../../../entities/credential');
const { Op } = require('sequelize');

describe('fetchAllPartner Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch partners using OR conditions and LIKE query', async () => {
    const query = "john";
    const mockResult = [{ id: 1, username: "john123", name: "John Doe" }];

    credential.findAll.mockResolvedValue(mockResult);

    const result = await fetchAllPartner(query);

    expect(credential.findAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${query}%` } },
          { name: { [Op.like]: `%${query}%` } },
        ],
        role: 'PARTNER',
      },
      attributes: ['id', 'username', 'name'],
    });

    expect(result).toBe(mockResult);
  });

  it('should return an empty array when no matching partners exist', async () => {
    credential.findAll.mockResolvedValue([]);

    const result = await fetchAllPartner("xyz");

    expect(result).toEqual([]);
  });

  it('should catch errors and log them instead of throwing', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    const err = new Error("DB failure");

    credential.findAll.mockRejectedValue(err);

    await fetchAllPartner("test");

    expect(consoleSpy).toHaveBeenCalledWith(err);
    expect(consoleSpy).toHaveBeenCalledWith(err.message.message);

    consoleSpy.mockRestore();
  });

  it('should always log the finally message', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

    credential.findAll.mockResolvedValue([]);

    await fetchAllPartner("something");

    expect(consoleSpy).toHaveBeenCalledWith("FETCH CORPORATE ROUTE CALLED");

    consoleSpy.mockRestore();
  });

});
