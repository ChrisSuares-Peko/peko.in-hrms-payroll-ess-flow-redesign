const setting = require('../../../entities/setting');
const { create } = require('../../settings');

jest.mock('../../../entities/setting', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));

describe('settings.create', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a setting successfully', async () => {
    const mockData = { name: 'testSetting', details: { key: 'value' } };
    const mockResponse = { id: 1, ...mockData };

    setting.create.mockResolvedValue(mockResponse);

    const result = await create(mockData);

    expect(setting.create).toHaveBeenCalledWith(mockData);
    expect(setting.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockResponse);
  });

  it('should throw error when creation fails', async () => {
    const mockData = { name: 'testSetting' };

    setting.create.mockRejectedValue(new Error('DB Error'));

    await expect(create(mockData)).rejects.toThrow('DB Error');
    expect(setting.create).toHaveBeenCalledTimes(1);
  });
});
