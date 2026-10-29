const setting = require('../../../entities/setting');
const { createOrUpdate } = require('../../settings');

jest.mock('../../../entities/setting', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));

describe('settings.createOrUpdate', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update existing setting when found', async () => {
    const mockParams = { name: 'existingSetting' };
    const mockData = { details: { key: 'updatedValue' } };
    const existingSetting = { id: 1, name: 'existingSetting', details: { key: 'oldValue' } };
    const updatedSetting = { id: 1, name: 'existingSetting', details: { key: 'updatedValue' } };

    setting.findOne
      .mockResolvedValueOnce(existingSetting) // First call - check existence
      .mockResolvedValueOnce(updatedSetting); // Second call - return updated
    setting.update.mockResolvedValue([1]);

    const result = await createOrUpdate(mockParams, mockData);

    expect(setting.findOne).toHaveBeenCalledTimes(2);
    expect(setting.update).toHaveBeenCalledWith(mockData, {
      where: { name: 'existingSetting' },
    });
    expect(result).toEqual(updatedSetting);
  });

  it('should create new setting when not found', async () => {
    const mockParams = { name: 'newSetting' };
    const mockData = { details: { key: 'value' } };
    const createdSetting = { id: 2, name: 'newSetting', details: { key: 'value' } };

    setting.findOne.mockResolvedValueOnce(null); // Not found
    setting.create.mockResolvedValue(createdSetting);

    const result = await createOrUpdate(mockParams, mockData);

    expect(setting.findOne).toHaveBeenCalledTimes(1);
    expect(setting.create).toHaveBeenCalledWith({
      name: 'newSetting',
      ...mockData,
    });
    expect(setting.update).not.toHaveBeenCalled();
    expect(result).toEqual(createdSetting);
  });

  it('should throw error when DB fails', async () => {
    const mockParams = { name: 'testSetting' };
    const mockData = { details: {} };

    setting.findOne.mockRejectedValue(new Error('DB Error'));

    await expect(createOrUpdate(mockParams, mockData)).rejects.toThrow('DB Error');
  });
});
