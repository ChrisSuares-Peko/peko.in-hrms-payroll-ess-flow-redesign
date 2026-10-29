const { fetchAllCustomers } = require("../../invoiceCustomer");
const invoiceCustomer = require("../../../entities/invoiceCustomer");
const { Op } = require('sequelize');

jest.mock('../../../entities/invoiceCustomer', () => ({
  findAll: jest.fn(),
  hasOne: jest.fn(),
}));

describe('fetchAllCustomers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all customers matching the query and corporateId', async () => {
    const query = 'John';
    const corporateId = 123;
    const mockResponseData = [
      { id: 1, name: 'John Doe', corporateUserId: corporateId },
      { id: 2, name: 'Johnny Appleseed', corporateUserId: corporateId },
    ];

    invoiceCustomer.findAll.mockResolvedValue(mockResponseData);

    const result = await fetchAllCustomers(query, corporateId);

    expect(invoiceCustomer.findAll).toHaveBeenCalledWith({
      where: {
        corporateUserId: corporateId,
        name: {
          [Op.like]: `%${query}%`,
        },
      },
      order: [['name', 'ASC']],
      raw: true,
      nest: true,
    });
    expect(result).toEqual(mockResponseData);
  });

  it('should return an empty array if no customers match the query and corporateId', async () => {
    const query = 'NonExistingCustomer';
    const corporateId = 123;
    const mockResponseData = [];

    invoiceCustomer.findAll.mockResolvedValue(mockResponseData);

    const result = await fetchAllCustomers(query, corporateId);

    expect(invoiceCustomer.findAll).toHaveBeenCalledWith({
      where: {
        corporateUserId: corporateId,
        name: {
          [Op.like]: `%${query}%`,
        },
      },
      order: [['name', 'ASC']],
      raw: true,
      nest: true,
    });
    expect(result).toEqual([]);
  });

  it('should throw an error if findAll method fails', async () => {
    const query = 'John';
    const corporateId = 123;
    const expectedError = new Error('Database error');

    invoiceCustomer.findAll.mockRejectedValue(expectedError);

    await expect(fetchAllCustomers(query, corporateId)).rejects.toThrow('Database error');
    expect(invoiceCustomer.findAll).toHaveBeenCalledWith({
      where: {
        corporateUserId: corporateId,
        name: {
          [Op.like]: `%${query}%`,
        },
      },
      order: [['name', 'ASC']],
      raw: true,
      nest: true,
    });
  });
});
