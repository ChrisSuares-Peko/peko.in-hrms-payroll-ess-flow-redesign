const { findInvoice } = require('../../invoicingV2');
const invoicingV2 = require('../../../entities/invoicingV2');
const corporateUser = require('../../../entities/corporateUser');

jest.mock('../../../entities/invoicingV2');
jest.mock('../../../entities/corporateUser');

describe('findInvoice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the invoice with corporateUser details when found', async () => {
    const params = { id: 1 };

    const mockInvoiceData = {
      id: 1,
      corporateUserId: 10,
      invoiceNumber: 'INV-001',
      name: 'John Doe',
      totalAmount: 5000,
      corporateUser: {
        name: 'Acme Corp',
        email: 'acme@example.com',
        mobileNo: '9876543210',
        gstNumber: 'GST123456',
        logo: 'https://example.com/logo.png',
      },
    };

    invoicingV2.findOne.mockResolvedValue(mockInvoiceData);

    const result = await findInvoice(params);

    expect(invoicingV2.findOne).toHaveBeenCalledWith({
      where: params,
      include: [
        {
          model: corporateUser,
          attributes: ['name', 'companyName', 'email', 'mobileNo', 'gstNumber', 'logo', 'city', 'state', 'poBox'],
        },
      ],
      raw: true,
      nest: true,
    });
    expect(result).toEqual(mockInvoiceData);
  });

  it('should return null when invoice is not found', async () => {
    const params = { id: 9999 };

    invoicingV2.findOne.mockResolvedValue(null);

    const result = await findInvoice(params);

    expect(invoicingV2.findOne).toHaveBeenCalledWith({
      where: params,
      include: [
        {
          model: corporateUser,
          attributes: ['name', 'companyName', 'email', 'mobileNo', 'gstNumber', 'logo', 'city', 'state', 'poBox'],
        },
      ],
      raw: true,
      nest: true,
    });
    expect(result).toBeNull();
  });

  it('should throw an error if the database query fails', async () => {
    const params = { id: 1 };

    const expectedError = new Error('Database error');

    invoicingV2.findOne.mockRejectedValue(expectedError);

    await expect(findInvoice(params)).rejects.toThrow('Database error');
    expect(invoicingV2.findOne).toHaveBeenCalledWith({
      where: params,
      include: [
        {
          model: corporateUser,
          attributes: ['name', 'companyName', 'email', 'mobileNo', 'gstNumber', 'logo', 'city', 'state', 'poBox'],
        },
      ],
      raw: true,
      nest: true,
    });
  });
});
