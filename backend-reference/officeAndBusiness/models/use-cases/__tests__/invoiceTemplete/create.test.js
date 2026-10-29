const { create } = require('../../invoiceTemplete');
const invoiceTemplete = require('../../../entities/invoiceTemplete');

jest.mock('../../../entities/invoiceTemplete');

describe('create', () => {
  const mockParams = {
    type: 'Invoice',
    subject: 'Test Subject',
    body: 'This is a test body',
  };

  const mockResponse = {
    id: 1,
    ...mockParams,
    createdAt: '2024-05-11T04:49:51.000Z',
    updatedAt: '2024-05-11T04:49:51.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new invoice template and return the response', async () => {
    invoiceTemplete.create.mockResolvedValue(mockResponse);

    const result = await create(mockParams);

    expect(invoiceTemplete.create).toHaveBeenCalledWith(mockParams);
    expect(result).toEqual(mockResponse);
  });

  it('should return false and log an error if creation fails', async () => {
    const mockError = new Error('Database error');
    invoiceTemplete.create.mockRejectedValue(mockError);

    console.error = jest.fn();

    const result = await create(mockParams);

    expect(invoiceTemplete.create).toHaveBeenCalledWith(mockParams);
    expect(console.error).toHaveBeenCalledWith('Error occurred while bulk creating:', mockError);
    expect(result).toBe(false);
  });
});
