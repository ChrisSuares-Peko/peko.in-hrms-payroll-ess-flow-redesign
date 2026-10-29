const { saveDocumentTypePrefixes } = require('../../invoiceSettingsV2');
const invoiceSettingsV2 = require('../../../entities/invoiceSettingsV2');

jest.mock('../../../entities/invoiceSettingsV2');

describe('saveDocumentTypePrefixes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new record with prefixes when no record exists', async () => {
    const corporateUserId = 10;
    const documentPrefixes = [{ type: 'INVOICE', prefix: 'INV-' }];

    const mockRecord = {
      id: 1,
      corporateUserId: 10,
      documentNumberPrefix: documentPrefixes,
    };

    invoiceSettingsV2.findOne.mockResolvedValue(null);
    invoiceSettingsV2.create.mockResolvedValue(mockRecord);

    const result = await saveDocumentTypePrefixes(corporateUserId, documentPrefixes);

    expect(invoiceSettingsV2.findOne).toHaveBeenCalledWith({ where: { corporateUserId: 10 } });
    expect(invoiceSettingsV2.create).toHaveBeenCalledWith({
      corporateUserId: 10,
      documentNumberPrefix: documentPrefixes,
    });
    expect(result).toEqual(mockRecord);
  });

  it('should update existing prefix when record exists and type matches', async () => {
    const corporateUserId = 10;
    const documentPrefixes = [{ type: 'INVOICE', prefix: 'INV-NEW-' }];

    const mockRecord = {
      id: 1,
      corporateUserId: 10,
      documentNumberPrefix: [{ type: 'INVOICE', prefix: 'INV-' }],
      set: jest.fn(),
      save: jest.fn().mockResolvedValue(),
    };

    invoiceSettingsV2.findOne.mockResolvedValue(mockRecord);

    const result = await saveDocumentTypePrefixes(corporateUserId, documentPrefixes);

    expect(invoiceSettingsV2.findOne).toHaveBeenCalledWith({ where: { corporateUserId: 10 } });
    expect(mockRecord.set).toHaveBeenCalledWith('documentNumberPrefix', [{ type: 'INVOICE', prefix: 'INV-NEW-' }]);
    expect(mockRecord.save).toHaveBeenCalled();
    expect(result).toEqual(mockRecord);
  });

  it('should add new prefix type when record exists but type does not match', async () => {
    const corporateUserId = 10;
    const documentPrefixes = [{ type: 'QUOTATION', prefix: 'QT-' }];

    const mockRecord = {
      id: 1,
      corporateUserId: 10,
      documentNumberPrefix: [{ type: 'INVOICE', prefix: 'INV-' }],
      set: jest.fn(),
      save: jest.fn().mockResolvedValue(),
    };

    invoiceSettingsV2.findOne.mockResolvedValue(mockRecord);

    await saveDocumentTypePrefixes(corporateUserId, documentPrefixes);

    expect(mockRecord.set).toHaveBeenCalledWith('documentNumberPrefix', [
      { type: 'INVOICE', prefix: 'INV-' },
      { type: 'QUOTATION', prefix: 'QT-' },
    ]);
    expect(mockRecord.save).toHaveBeenCalled();
  });

  it('should handle existing record with null documentNumberPrefix', async () => {
    const corporateUserId = 10;
    const documentPrefixes = [{ type: 'INVOICE', prefix: 'INV-' }];

    const mockRecord = {
      id: 1,
      corporateUserId: 10,
      documentNumberPrefix: null,
      set: jest.fn(),
      save: jest.fn().mockResolvedValue(),
    };

    invoiceSettingsV2.findOne.mockResolvedValue(mockRecord);

    await saveDocumentTypePrefixes(corporateUserId, documentPrefixes);

    expect(mockRecord.set).toHaveBeenCalledWith('documentNumberPrefix', [{ type: 'INVOICE', prefix: 'INV-' }]);
    expect(mockRecord.save).toHaveBeenCalled();
  });

  it('should throw an error if database query fails', async () => {
    const corporateUserId = 10;
    const documentPrefixes = [{ type: 'INVOICE', prefix: 'INV-' }];

    const expectedError = new Error('Database error');

    invoiceSettingsV2.findOne.mockRejectedValue(expectedError);

    await expect(saveDocumentTypePrefixes(corporateUserId, documentPrefixes)).rejects.toThrow('Database error');
  });
});
