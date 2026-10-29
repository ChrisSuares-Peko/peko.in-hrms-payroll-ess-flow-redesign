const { checkGstinExist } = require('../../invoiceCustomerV2');
const InvoiceCustomerV2 = require('../../../entities/invoiceCustomerV2');
const { Op } = require('sequelize');

jest.mock('../../../entities/invoiceCustomerV2');

describe('checkGstinExist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return customer when gstin exists for the corporateUserId', async () => {
    const mockCustomer = { id: 1, gstin: '29ABCDE1234F1Z5', corporateUserId: 10 };

    InvoiceCustomerV2.findOne.mockResolvedValue(mockCustomer);

    const result = await checkGstinExist('29ABCDE1234F1Z5', 10);

    expect(InvoiceCustomerV2.findOne).toHaveBeenCalledWith({
      where: { gstin: '29ABCDE1234F1Z5', corporateUserId: 10 },
    });
    expect(result).toEqual(mockCustomer);
  });

  it('should exclude the given id when provided', async () => {
    InvoiceCustomerV2.findOne.mockResolvedValue(null);

    const result = await checkGstinExist('29ABCDE1234F1Z5', 10, 5);

    expect(InvoiceCustomerV2.findOne).toHaveBeenCalledWith({
      where: { gstin: '29ABCDE1234F1Z5', corporateUserId: 10, id: { [Op.ne]: 5 } },
    });
    expect(result).toBeNull();
  });

  it('should return null when gstin does not exist', async () => {
    InvoiceCustomerV2.findOne.mockResolvedValue(null);

    const result = await checkGstinExist('NONEXISTENT', 10);

    expect(InvoiceCustomerV2.findOne).toHaveBeenCalledWith({
      where: { gstin: 'NONEXISTENT', corporateUserId: 10 },
    });
    expect(result).toBeNull();
  });

  it('should throw an error if database query fails', async () => {
    const expectedError = new Error('Database error');

    InvoiceCustomerV2.findOne.mockRejectedValue(expectedError);

    await expect(checkGstinExist('29ABCDE1234F1Z5', 10)).rejects.toThrow('Database error');
  });
});
