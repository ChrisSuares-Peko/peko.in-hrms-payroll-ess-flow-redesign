const { checkEmailExistV2 } = require('../../invoiceCustomerV2');
const InvoiceCustomerV2 = require('../../../entities/invoiceCustomerV2');
const { Op } = require('sequelize');

jest.mock('../../../entities/invoiceCustomerV2');

describe('checkEmailExistV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return customer when email exists for the corporateUserId', async () => {
    const mockCustomer = { id: 1, email: 'alpha@example.com', corporateUserId: 10 };

    InvoiceCustomerV2.findOne.mockResolvedValue(mockCustomer);

    const result = await checkEmailExistV2('alpha@example.com', 10);

    expect(InvoiceCustomerV2.findOne).toHaveBeenCalledWith({
      where: { email: 'alpha@example.com', corporateUserId: 10 },
    });
    expect(result).toEqual(mockCustomer);
  });

  it('should exclude the given id when provided', async () => {
    InvoiceCustomerV2.findOne.mockResolvedValue(null);

    const result = await checkEmailExistV2('alpha@example.com', 10, 5);

    expect(InvoiceCustomerV2.findOne).toHaveBeenCalledWith({
      where: { email: 'alpha@example.com', corporateUserId: 10, id: { [Op.ne]: 5 } },
    });
    expect(result).toBeNull();
  });

  it('should return null when email does not exist', async () => {
    InvoiceCustomerV2.findOne.mockResolvedValue(null);

    const result = await checkEmailExistV2('nonexistent@example.com', 10);

    expect(InvoiceCustomerV2.findOne).toHaveBeenCalledWith({
      where: { email: 'nonexistent@example.com', corporateUserId: 10 },
    });
    expect(result).toBeNull();
  });

  it('should throw an error if database query fails', async () => {
    const expectedError = new Error('Database error');

    InvoiceCustomerV2.findOne.mockRejectedValue(expectedError);

    await expect(checkEmailExistV2('alpha@example.com', 10)).rejects.toThrow('Database error');
  });
});
