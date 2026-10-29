const { checkPhoneNumberExistV2 } = require('../../invoiceCustomerV2');
const InvoiceCustomerV2 = require('../../../entities/invoiceCustomerV2');
const { Op } = require('sequelize');

jest.mock('../../../entities/invoiceCustomerV2');

describe('checkPhoneNumberExistV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return customer when phone number exists for the corporateUserId', async () => {
    const mockCustomer = { id: 1, phoneNumber: '9876543210', corporateUserId: 10 };

    InvoiceCustomerV2.findOne.mockResolvedValue(mockCustomer);

    const result = await checkPhoneNumberExistV2('9876543210', 10);

    expect(InvoiceCustomerV2.findOne).toHaveBeenCalledWith({
      where: { phoneNumber: '9876543210', corporateUserId: 10 },
    });
    expect(result).toEqual(mockCustomer);
  });

  it('should exclude the given id when provided', async () => {
    InvoiceCustomerV2.findOne.mockResolvedValue(null);

    const result = await checkPhoneNumberExistV2('9876543210', 10, 5);

    expect(InvoiceCustomerV2.findOne).toHaveBeenCalledWith({
      where: { phoneNumber: '9876543210', corporateUserId: 10, id: { [Op.ne]: 5 } },
    });
    expect(result).toBeNull();
  });

  it('should return null when phone number does not exist', async () => {
    InvoiceCustomerV2.findOne.mockResolvedValue(null);

    const result = await checkPhoneNumberExistV2('0000000000', 10);

    expect(InvoiceCustomerV2.findOne).toHaveBeenCalledWith({
      where: { phoneNumber: '0000000000', corporateUserId: 10 },
    });
    expect(result).toBeNull();
  });

  it('should throw an error if database query fails', async () => {
    const expectedError = new Error('Database error');

    InvoiceCustomerV2.findOne.mockRejectedValue(expectedError);

    await expect(checkPhoneNumberExistV2('9876543210', 10)).rejects.toThrow('Database error');
  });
});
