const { getInitialServicePermission } = require('../../setting'); // Adjust the path as needed
const setting = require('../../../entities/setting');

jest.mock('../../../entities/setting', () => ({
  findOne: jest.fn(),
}));

describe('getInitialServicePermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the details from the settings if it exists', async () => {
    const mockDetails = { permission1: true, permission2: false };
    const mockSetting = { details: mockDetails };

    setting.findOne.mockResolvedValue(mockSetting);

    const result = await getInitialServicePermission();

    // Verify `findOne` is called with the correct parameters
    expect(setting.findOne).toHaveBeenCalledWith({
      where: {
        name: 'initialServicePermissions',
      },
    });

    // Validate the result
    expect(result).toEqual(mockDetails);
  });

  it('should handle errors thrown during the database operation', async () => {
    const mockError = new Error('Database error');

    // Mock `findOne` to throw an error
    setting.findOne.mockRejectedValue(mockError);

    await expect(getInitialServicePermission()).rejects.toThrow('Database error');

    // Verify `findOne` is called with the correct parameters
    expect(setting.findOne).toHaveBeenCalledWith({
      where: {
        name: 'initialServicePermissions',
      },
    });
  });
});
