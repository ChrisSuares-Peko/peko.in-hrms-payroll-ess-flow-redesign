const { getAllTemplete } = require('../../invoiceTemplete');
const invoiceTemplete = require('../../../entities/invoiceTemplete');

jest.mock('../../../entities/invoiceTemplete');

describe('getAllTemplete', () => {
  const mockStatus = 'ACTIVE';
  const mockResponseData = {
    count: 1,
    rows: [
     
      {
        id: 2,
        name: 'Template 2',
        status: 'INACTIVE',
        createdAt: '2024-05-10T04:49:51.000Z',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return templates with the specified status', async () => {
    invoiceTemplete.findAndCountAll.mockResolvedValue(mockResponseData);

    const result = await getAllTemplete(mockStatus);

    expect(invoiceTemplete.findAndCountAll).toHaveBeenCalledWith({
      where: { status: mockStatus },
      order: [['createdAt', 'DESC']],
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResponseData);
  });

  it('should return all templates when status is not provided', async () => {
    invoiceTemplete.findAndCountAll.mockResolvedValue(mockResponseData);

    const result = await getAllTemplete();

    expect(invoiceTemplete.findAndCountAll).toHaveBeenCalledWith({
      where: {},
      order: [['createdAt', 'DESC']],
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResponseData);
  });

  it('should return false if no data is found', async () => {
    invoiceTemplete.findAndCountAll.mockResolvedValue(null);

    const result = await getAllTemplete(mockStatus);

    expect(result).toBe(false);
  });

  it('should handle errors during the database query', async () => {
    const mockError = new Error('Database error');
    invoiceTemplete.findAndCountAll.mockRejectedValue(mockError);

    console.error = jest.fn();

    await expect(getAllTemplete(mockStatus)).rejects.toThrow('Database error');
    
  });
});
