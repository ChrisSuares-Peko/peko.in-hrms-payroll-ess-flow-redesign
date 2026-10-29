const { findAllInvoicesAndCount } = require('../../invoices');
const invoice = require('../../../entities/invoices');
const SubCorporateUser = require('../../../entities/subCorporateUsers');
const { Op } = require('sequelize');


jest.mock('../../../entities/subCorporateUsers');
jest.mock('../../../entities/invoices', () => ({
  belongsTo: jest.fn(),
  findAndCountAll: jest.fn(),
}));

describe('findAllInvoicesAndCount', () => {
 
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all invoices with the correct query parameters', async () => {
    const mockResponseData = {
      rows: [
        {
          id: 458,
          recipientDetails: "{\"billTo\":\"jithin\",\"customerName\":\"jithin\",\"customerAddress\":\"address\",\"customerEmail\":\"jithin@gmail.com\"}",
          invoiceDetails: "{\"invoiceDate\":\"02/18/2024\",\"invoiceNo\":\"123\",\"dueDate\":\"21-02-2024\",\"poNo\":\"123\",\"logo\":\"https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/profile%2Fimages%2F1707457319157.png?alt=media&token=aa4376cf-5452-4807-9694-5899c083bfa7\"}",
          productDetails: "[{\"item\":\"item\",\"quantity\":\"1\",\"price\":\"10\",\"amount\":\"10.00\"}]",
          paymentDetails: "{\"subTotal\":\"10.00\",\"tax\":\"\",\"discount\":\"\",\"shippingCharge\":\"\",\"total\":\"10.00\",\"amountPaid\":\"\",\"balanceDue\":\"10.00\",\"currency\":\"AED\",\"accountHolderName\":\"CHRISTAPHER ANTONY\",\"accountNumber\":\"2226312133\",\"bankName\":\"Lean 1st Corporate Mockbank\",\"iban\":\"AE234324324234\"}",
          comments: "",
          termsConditions: "",
          paymentMode: null,
          createdAt: "2024-02-10T06:50:09.000Z",
          updatedAt: "2024-02-10T06:50:09.000Z",
          credentialId: 160
        },
      ],
      count: 1,
    };

    invoice.findAndCountAll.mockResolvedValue(mockResponseData);

    const params = {
      from: '2024-01-01',
      to: '2024-12-31',
      limit: 10,
      offset: 0,
      searchText: 'test',
      sort: 'ASC',
      userId: 1,
      subCorporateUserId: null,
    };

    const result = await findAllInvoicesAndCount(params);

    expect(invoice.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: SubCorporateUser,
          attributes: ['id', 'name'],
          required: false,
        },
      ],
      where: {
        [Op.or]: [
          { id: { [Op.like]: '%test%' } },
          { recipientDetails: { [Op.like]: '%test%' } },
          { invoiceDetails: { [Op.like]: '%test%' } },
          { productDetails: { [Op.like]: '%test%' } },
          { paymentDetails: { [Op.like]: '%test%' } },
          { comments: { [Op.like]: '%test%' } },
          { termsConditions: { [Op.like]: '%test%' } },
        ],
        credentialId: 1,
        createdAt: { [Op.between]: ['2024-01-01', expect.any(Date)] },
      },
      order: [['id', 'ASC']],
      limit: 10,
      offset: 0,
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResponseData);
  });

  it('should handle cases where no invoices are found', async () => {
    invoice.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 0,
    });

    const params = {
      from: '2024-01-01',
      to: '2024-12-31',
      limit: 10,
      offset: 0,
      searchText: 'test',
      sort: 'ASC',
      userId: 1,
      subCorporateUserId: null,
    };

    const result = await findAllInvoicesAndCount(params);

    expect(invoice.findAndCountAll).toHaveBeenCalledWith(expect.any(Object));
    expect(result).toEqual({
      rows: [],
      count: 0,
    });
  });

  it('should handle exceptions thrown during execution', async () => {
    const errorMessage = 'Database error';
    invoice.findAndCountAll.mockRejectedValue(new Error(errorMessage));

    const params = {
      from: '2024-01-01',
      to: '2024-12-31',
      limit: 10,
      offset: 0,
      searchText: 'test',
      sort: 'ASC',
      userId: 1,
      subCorporateUserId: null,
    };

    await expect(findAllInvoicesAndCount(params)).rejects.toThrow(new Error(errorMessage));
  });
});
