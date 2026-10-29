const { fetchAllSubPartnerList } = require('../../credential');
const credential = require('../../../entities/credential');
jest.mock('../../../entities/credential');
const { Op } = require('sequelize');

describe('fetchAllSubPartnerList Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all sub-partners with the correct filters', async () => {
    const partnerId = 10;
    const mockResult = [{ id: 1, username: 'u1', name: 'User One' }];

    credential.findAll.mockResolvedValue(mockResult);

    const result = await fetchAllSubPartnerList(partnerId);

    expect(credential.findAll).toHaveBeenCalledWith({
      where: {
        role: 'SYSTEM_USER',
        subPartnerId: { [Op.ne]: null },
        registeredBy: partnerId,
      },
      attributes: ['id', 'username', 'name'],
    });

    expect(result).toBe(mockResult);
  });


  it('should return an empty array when no sub-partners exist', async () => {
    credential.findAll.mockResolvedValue([]);

    const result = await fetchAllSubPartnerList(5);

    expect(result).toEqual([]);
  });


  it('should catch errors and log them instead of throwing', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    const error = new Error('Database failed');

    credential.findAll.mockRejectedValue(error);

    await fetchAllSubPartnerList(20);

    expect(consoleSpy).toHaveBeenCalledWith(error);
    expect(consoleSpy).toHaveBeenCalledWith(error.message.message); // your weird nested log

    consoleSpy.mockRestore();
  });
  it('should always log the finally block message', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

    credential.findAll.mockResolvedValue([]);

    await fetchAllSubPartnerList(15);

    expect(consoleSpy).toHaveBeenCalledWith("FETCH SUB PARTNERS ROUTE CALLED");

    consoleSpy.mockRestore();
  });
});
