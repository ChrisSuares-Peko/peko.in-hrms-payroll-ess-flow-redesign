const { getInvoiceCountByStatus } = require('../../invoices'); 
const invoice = require('../../../entities/invoices'); 

jest.mock('../../../entities/invoices');

describe('getInvoiceCountByStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the correct count of invoices for a given status and credentialId', async () => {
    const status = 'PAID';
    const credentialId = 1;
    const mockCount = 7;

    invoice.count.mockResolvedValue(mockCount);

    const count = await getInvoiceCountByStatus(status, credentialId, null);

    expect(invoice.count).toHaveBeenCalledWith({
      where: {
        credentialId: credentialId,
        status: status,
      },
    });
    expect(count).toBe(mockCount);
  });

  it('should return the correct count of invoices with subCorporateUserId', async () => {
    const status = 'PENDING';
    const credentialId = 1;
    const subCorporateUserId = 123;
    const mockCount = 4;

    invoice.count.mockResolvedValue(mockCount);

    const count = await getInvoiceCountByStatus(status, credentialId, subCorporateUserId);

    expect(invoice.count).toHaveBeenCalledWith({
      where: {
        credentialId: credentialId,
        status: status,
        subCorporateUserId: subCorporateUserId,
      },
    });
    expect(count).toBe(mockCount);
  });

  it('should handle errors and pass them to next middleware', async () => {
    const status = 'EXPIRED';
    const credentialId = 1;
    const errorMessage = 'Database error';

    invoice.count.mockRejectedValue(new Error(errorMessage));

    await expect(getInvoiceCountByStatus(status, credentialId, null)).rejects.toThrow(new Error(errorMessage));
  });
});
