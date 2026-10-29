const { getBotBuilderValues } = require('../../setting');
const setting = require('../../../entities/setting');

jest.mock('../../../entities/setting', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));

describe('setting - getBotBuilderValues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return bot builder values', async () => {
    const mockResult = { id: 2, name: 'flowBuilder', details: { enabled: true } };
    setting.findOne.mockResolvedValue(mockResult);

    const result = await getBotBuilderValues();

    expect(setting.findOne).toHaveBeenCalledWith({ where: { name: 'flowBuilder' } });
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    setting.findOne.mockResolvedValue(null);

    const result = await getBotBuilderValues();

    expect(result).toBeNull();
  });
});
