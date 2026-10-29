const { deleteTemplate } = require('../../invoiceTemplete');
const invoiceTemplete = require('../../../entities/invoiceTemplete');

jest.mock('../../../entities/invoiceTemplete');

describe('deleteTemplate', () => {
  const mockParams = { id: 1 };

  const mockResponse = 1; // Sequelize's destroy method returns the number of affected rows, usually 1 if successful.

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a template and return the number of affected rows', async () => {
    invoiceTemplete.destroy.mockResolvedValue(mockResponse);

    const result = await deleteTemplate(mockParams);

    expect(invoiceTemplete.destroy).toHaveBeenCalledWith({
      where: { id: mockParams.id },
    });
    expect(result).toEqual(mockResponse);
  });

  it('should return 0 if no rows were affected', async () => {
    invoiceTemplete.destroy.mockResolvedValue(0);

    const result = await deleteTemplate(mockParams);

    expect(invoiceTemplete.destroy).toHaveBeenCalledWith({
      where: { id: mockParams.id },
    });
    expect(result).toEqual(0);
  });

  it('should throw an error if the delete operation fails', async () => {
    const mockError = new Error('Database error');
    invoiceTemplete.destroy.mockRejectedValue(mockError);

    await expect(deleteTemplate(mockParams)).rejects.toThrow('Database error');
  });
});
