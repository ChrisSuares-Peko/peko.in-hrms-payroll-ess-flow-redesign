const { getInvoiceCount } = require('../../invoices');
const invoice = require('../../../entities/invoices');

jest.mock('../../../entities/invoices');

describe('getInvoiceCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the correct count of invoices for a given credentialId', async () => {
    const credentialId = 1;
    const mockCount = 5;

    invoice.count.mockResolvedValue(mockCount);

    const count = await getInvoiceCount(credentialId, null);

    expect(invoice.count).toHaveBeenCalledWith({
      where: {
        credentialId: credentialId,
      },
    });
    expect(count).toBe(mockCount);
  });

  it('should return the correct count of invoices with subCorporateUserId', async () => {
    const credentialId = 1;
    const subCorporateUserId = 123;
    const mockCount = 3;

    invoice.count.mockResolvedValue(mockCount);

    const count = await getInvoiceCount(credentialId, subCorporateUserId);

    expect(invoice.count).toHaveBeenCalledWith({
      where: {
        credentialId: credentialId,
        subCorporateUserId: subCorporateUserId,
      },
    });
    expect(count).toBe(mockCount);
  });

  it('should handle errors and pass them to next middleware', async () => {
    const credentialId = 1;
    const errorMessage = 'Database error';

    invoice.count.mockRejectedValue(new Error(errorMessage));

    await expect(getInvoiceCount(credentialId, null)).rejects.toThrow(new Error(errorMessage));
  });
});
