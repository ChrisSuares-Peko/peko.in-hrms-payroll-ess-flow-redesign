const setting = require('../../../entities/setting');
const { update } = require('../../settings');

jest.mock('../../../entities/setting', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));

describe('settings.update', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update a setting and return the updated record', async () => {
    const mockParams = { name: 'testSetting' };
    const mockData = { details: { key: 'newValue' } };
    const mockUpdatedSetting = { id: 1, name: 'testSetting', details: { key: 'newValue' } };

    setting.update.mockResolvedValue([1]); // 1 row updated
    setting.findOne.mockResolvedValue(mockUpdatedSetting);

    const result = await update(mockParams, mockData);

    expect(setting.update).toHaveBeenCalledWith(mockData, {
      where: { name: 'testSetting' },
    });
    expect(setting.findOne).toHaveBeenCalledWith({
      where: { name: 'testSetting' },
    });
    expect(result).toEqual(mockUpdatedSetting);
  });

  it('should return null when no rows are updated', async () => {
    const mockParams = { name: 'nonExistent' };
    const mockData = { details: { key: 'value' } };

    setting.update.mockResolvedValue([0]); // 0 rows updated

    const result = await update(mockParams, mockData);

    expect(setting.update).toHaveBeenCalledWith(mockData, {
      where: { name: 'nonExistent' },
    });
    expect(setting.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should throw error when update fails', async () => {
    const mockParams = { name: 'testSetting' };
    const mockData = { details: {} };

    setting.update.mockRejectedValue(new Error('DB Error'));

    await expect(update(mockParams, mockData)).rejects.toThrow('DB Error');
  });
});
