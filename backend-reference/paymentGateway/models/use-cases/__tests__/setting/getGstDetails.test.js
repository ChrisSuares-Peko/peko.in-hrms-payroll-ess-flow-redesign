const { getGstDetails } = require('../../setting');
const setting = require('../../../entities/setting');

jest.mock('../../../entities/setting', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));

describe('setting - getGstDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return gst details', async () => {
    const mockResult = { id: 1, name: 'taxRate', details: { rate: 5 } };
    setting.findOne.mockResolvedValue(mockResult);

    const result = await getGstDetails();

    expect(setting.findOne).toHaveBeenCalledWith({ where: { name: 'taxRate' } });
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    setting.findOne.mockResolvedValue(null);

    const result = await getGstDetails();

    expect(result).toBeNull();
  });

  it('should throw on error', async () => {
    setting.findOne.mockRejectedValue(new Error('DB Error'));

    await expect(getGstDetails()).rejects.toThrow('DB Error');
  });
});
