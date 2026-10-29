const { findSettings } = require('../../invoiceSettingsV2');
const invoiceSettingsV2 = require('../../../entities/invoiceSettingsV2');

jest.mock('../../../entities/invoiceSettingsV2');

describe('findSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return settings when found for the corporateUserId', async () => {
    const corporateUserId = 10;

    const mockSettings = {
      id: 1,
      corporateUserId: 10,
      businessName: 'Acme Corp',
      logo: 'https://example.com/logo.png',
    };

    invoiceSettingsV2.findOne.mockResolvedValue(mockSettings);

    const result = await findSettings(corporateUserId);

    expect(invoiceSettingsV2.findOne).toHaveBeenCalledWith({ where: { corporateUserId: 10 } });
    expect(result).toEqual(mockSettings);
  });

  it('should return null when no settings found', async () => {
    const corporateUserId = 999;

    invoiceSettingsV2.findOne.mockResolvedValue(null);

    const result = await findSettings(corporateUserId);

    expect(invoiceSettingsV2.findOne).toHaveBeenCalledWith({ where: { corporateUserId: 999 } });
    expect(result).toBeNull();
  });

  it('should throw an error if database query fails', async () => {
    const corporateUserId = 10;

    const expectedError = new Error('Database error');

    invoiceSettingsV2.findOne.mockRejectedValue(expectedError);

    await expect(findSettings(corporateUserId)).rejects.toThrow('Database error');
  });
});
