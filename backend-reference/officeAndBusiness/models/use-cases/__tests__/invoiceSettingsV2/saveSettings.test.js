const { saveSettings } = require('../../invoiceSettingsV2');
const invoiceSettingsV2 = require('../../../entities/invoiceSettingsV2');

jest.mock('../../../entities/invoiceSettingsV2', () => ({
  findOrCreate: jest.fn(),
}));

describe('saveSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create new settings when record does not exist', async () => {
    const corporateUserId = 10;
    const data = { businessName: 'Acme Corp', logo: 'https://example.com/logo.png' };

    const mockRecord = {
      id: 1,
      corporateUserId: 10,
      ...data,
      update: jest.fn(),
    };

    invoiceSettingsV2.findOrCreate.mockResolvedValue([mockRecord, true]);

    const result = await saveSettings(corporateUserId, data);

    expect(invoiceSettingsV2.findOrCreate).toHaveBeenCalledWith({
      where: { corporateUserId: 10 },
      defaults: { corporateUserId: 10, ...data },
    });
    expect(mockRecord.update).not.toHaveBeenCalled();
    expect(result).toEqual(mockRecord);
  });

  it('should update existing settings when record already exists', async () => {
    const corporateUserId = 10;
    const data = { businessName: 'Acme Corp Updated' };

    const mockRecord = {
      id: 1,
      corporateUserId: 10,
      businessName: 'Acme Corp',
      update: jest.fn().mockResolvedValue(),
    };

    invoiceSettingsV2.findOrCreate.mockResolvedValue([mockRecord, false]);

    const result = await saveSettings(corporateUserId, data);

    expect(invoiceSettingsV2.findOrCreate).toHaveBeenCalledWith({
      where: { corporateUserId: 10 },
      defaults: { corporateUserId: 10, ...data },
    });
    expect(mockRecord.update).toHaveBeenCalledWith(data);
    expect(result).toEqual(mockRecord);
  });

  it('should throw an error if database query fails', async () => {
    const corporateUserId = 10;
    const data = { businessName: 'Test' };

    const expectedError = new Error('Database error');

    invoiceSettingsV2.findOrCreate.mockRejectedValue(expectedError);

    await expect(saveSettings(corporateUserId, data)).rejects.toThrow('Database error');
  });
});
