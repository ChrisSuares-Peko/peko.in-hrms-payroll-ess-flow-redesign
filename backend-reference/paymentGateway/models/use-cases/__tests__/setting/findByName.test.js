const { findByName } = require('../../setting');
const setting = require('../../../entities/setting');

jest.mock('../../../entities/setting', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));

describe('setting - findByName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return setting when found by name', async () => {
    const mockResult = { id: 1, name: 'testSetting', details: {} };
    setting.findOne.mockResolvedValue(mockResult);

    const result = await findByName({ name: 'testSetting' });

    expect(setting.findOne).toHaveBeenCalledWith({ where: { name: 'testSetting' } });
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    setting.findOne.mockResolvedValue(null);

    const result = await findByName({ name: 'nonExistent' });

    expect(result).toBeNull();
  });
});
