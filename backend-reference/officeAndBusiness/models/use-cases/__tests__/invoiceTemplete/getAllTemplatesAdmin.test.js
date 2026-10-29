const { getAllTemplatesAdmin } = require('../../invoiceTemplete');
const invoiceTemplete = require('../../../entities/invoiceTemplete');
const { Op } = require('sequelize');

jest.mock('../../../entities/invoiceTemplete');

describe('getAllTemplatesAdmin', () => {
  const mockParams = {
    limit: 10,
    offset: 0,
    searchText: 'test',
    sort: 'DESC',
    sortField: 'createdAt',
  };

  const mockResponseData = {
    count: 1,
    rows: [
      {
        id: 1,
        type: 'Invoice',
        subject: 'Test Subject 1',
        body: 'This is a test body 1',
        createdAt: '2024-05-11T04:49:51.000Z',
      }
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return templates based on searchText, sorting, and pagination', async () => {
    invoiceTemplete.findAndCountAll.mockResolvedValue(mockResponseData);

    const result = await getAllTemplatesAdmin(mockParams);

    expect(invoiceTemplete.findAndCountAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { type: { [Op.like]: `%${mockParams.searchText}%` } },
          { subject: { [Op.like]: `%${mockParams.searchText}%` } },
          { body: { [Op.like]: `%${mockParams.searchText}%` } },
        ],
      },
      order: [[mockParams.sortField, mockParams.sort]],
      limit: mockParams.limit,
      offset: mockParams.offset,
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResponseData);
  });


});
