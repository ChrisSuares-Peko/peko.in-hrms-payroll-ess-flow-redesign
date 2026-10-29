const { findOneHikeDetails } = require('../../hike');
const hike = require('../../../entities/hike');

jest.mock('../../../entities/hike', () => ({
  findOne: jest.fn(),
}));

describe('hike - findOneHikeDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return hike details when found', async () => {
    const mockResult = { id: 1, name: 'Test Hike' };
    hike.findOne.mockResolvedValue(mockResult);

    const result = await findOneHikeDetails({ params: { id: 1 } });

    expect(hike.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    hike.findOne.mockResolvedValue(null);

    const result = await findOneHikeDetails({ params: { id: 999 } });

    expect(result).toBeNull();
  });

  it('should throw error on DB failure', async () => {
    hike.findOne.mockRejectedValue(new Error('DB Error'));

    await expect(findOneHikeDetails({ params: { id: 1 } })).rejects.toThrow('DB Error');
  });

  it('should log HIKE FIND ONE CALLED in finally', async () => {
    hike.findOne.mockResolvedValue(null);

    await findOneHikeDetails({ params: { id: 1 } });

    expect(console.log).toHaveBeenCalledWith('HIKE FIND ONE CALLED');
  });
});
