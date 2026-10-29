const { updateTemplate } = require('../../invoiceTemplete');
const invoiceTemplete = require('../../../entities/invoiceTemplete');

jest.mock('../../../entities/invoiceTemplete');

describe('updateTemplate', () => {
  const mockParams = { id: 1 };
  const mockData = {
    type: 'Invoice',
    subject: 'Updated Subject',
    body: 'Updated body content',
  };

  const mockResponse = [1]; // Sequelize's update method returns an array where the first element is the number of affected rows

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update an invoice template and return the number of affected rows', async () => {
    invoiceTemplete.update.mockResolvedValue(mockResponse);

    const result = await updateTemplate(mockParams, mockData);

    expect(invoiceTemplete.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });
    expect(result).toEqual(mockResponse);
  });

  it('should return an empty array if the update fails to find the template', async () => {
    invoiceTemplete.update.mockResolvedValue([0]);

    const result = await updateTemplate(mockParams, mockData);

    expect(invoiceTemplete.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });
    expect(result).toEqual([0]);
  });

  it('should throw an error if the update operation fails', async () => {
    const mockError = new Error('Database error');
    invoiceTemplete.update.mockRejectedValue(mockError);

    await expect(updateTemplate(mockParams, mockData)).rejects.toThrow('Database error');
  });
});
