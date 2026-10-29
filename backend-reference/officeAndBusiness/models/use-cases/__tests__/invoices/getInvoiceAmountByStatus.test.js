const { getInvoiceAmountByStatus } = require('../../invoices');
const invoice = require('../../../entities/invoices'); 
const Sequelize = require('sequelize');

jest.mock('../../../entities/invoices');

describe('getInvoiceAmountByStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the correct total amount for a given status and credentialId', async () => {
    const status = 'PAID';
    const credentialId = 1;
    const mockAmount = '1000.00';

    invoice.findAll.mockResolvedValue([
      {
        dataValues: { totalAmount: mockAmount },
      },
    ]);

    const totalAmount = await getInvoiceAmountByStatus(status, credentialId, null);

    expect(invoice.findAll).toHaveBeenCalledWith({
      attributes: [[Sequelize.fn('sum', Sequelize.col('amount')), 'totalAmount']],
      where: {
        credentialId: credentialId,
        status: status,
      },
    });
    expect(totalAmount).toBe(mockAmount);
  });

  it('should return the correct total amount with subCorporateUserId', async () => {
    const status = 'PENDING';
    const credentialId = 1;
    const subCorporateUserId = 123;
    const mockAmount = '500.00';

    invoice.findAll.mockResolvedValue([
      {
        dataValues: { totalAmount: mockAmount },
      },
    ]);

    const totalAmount = await getInvoiceAmountByStatus(status, credentialId, subCorporateUserId);

    expect(invoice.findAll).toHaveBeenCalledWith({
      attributes: [[Sequelize.fn('sum', Sequelize.col('amount')), 'totalAmount']],
      where: {
        credentialId: credentialId,
        status: status,
        subCorporateUserId: subCorporateUserId,
      },
    });
    expect(totalAmount).toBe(mockAmount);
  });

  it('should return 0 if no amounts are found', async () => {
    const status = 'EXPIRED';
    const credentialId = 1;

    invoice.findAll.mockResolvedValue([]);

    const totalAmount = await getInvoiceAmountByStatus(status, credentialId, null);

    expect(invoice.findAll).toHaveBeenCalledWith({
      attributes: [[Sequelize.fn('sum', Sequelize.col('amount')), 'totalAmount']],
      where: {
        credentialId: credentialId,
        status: status,
      },
    });
    expect(totalAmount).toBe(0);
  });

  it('should handle errors and pass them to next middleware', async () => {
    const status = 'PAID';
    const credentialId = 1;
    const errorMessage = 'Database error';

    invoice.findAll.mockRejectedValue(new Error(errorMessage));

    await expect(getInvoiceAmountByStatus(status, credentialId, null)).rejects.toThrow(new Error(errorMessage));
  });
});
