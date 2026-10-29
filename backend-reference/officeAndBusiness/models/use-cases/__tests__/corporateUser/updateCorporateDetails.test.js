const { updateCorporateDetails } = require('../../corporateUser'); // Adjust the path if needed
const corporateUser = require('../../../entities/corporateUser');

jest.mock('../../../entities/corporateUser', () => ({
  update: jest.fn(),
}));

describe('updateCorporateDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update corporate details', async () => {
    const params = { id: 1 };
    const data = { name: 'Updated Corporate Name' };
    const mockUpdateResult = [1]; // Sequelize returns an array with the number of rows affected

    corporateUser.update.mockResolvedValue(mockUpdateResult);

    const result = await updateCorporateDetails(params, data);

    expect(corporateUser.update).toHaveBeenCalledWith(data, {
      where: { id: params.id },
    });
    expect(result).toEqual(mockUpdateResult);
  });

  it('should handle when no rows are updated', async () => {
    const params = { id: 2 };
    const data = { name: 'Another Name' };
    const mockUpdateResult = [0]; // 0 rows affected

    corporateUser.update.mockResolvedValue(mockUpdateResult);

    const result = await updateCorporateDetails(params, data);

    expect(corporateUser.update).toHaveBeenCalledWith(data, {
      where: { id: params.id },
    });
    expect(result).toEqual(mockUpdateResult);
  });

  it('should handle errors thrown by corporateUser.update', async () => {
    const params = { id: 3 };
    const data = { name: 'Error Case' };
    const mockError = new Error('Database error');

    corporateUser.update.mockRejectedValue(mockError);

    await expect(updateCorporateDetails(params, data)).rejects.toThrow('Database error');

    expect(corporateUser.update).toHaveBeenCalledWith(data, {
      where: { id: params.id },
    });
  });

  it('should handle undefined data', async () => {
    const params = { id: 4 };
    const data = undefined;
    const mockError = new Error('Cannot read properties of undefined');

    corporateUser.update.mockRejectedValue(mockError);

    await expect(updateCorporateDetails(params, data)).rejects.toThrow('Cannot read properties of undefined');

    expect(corporateUser.update).toHaveBeenCalledWith(data, {
      where: { id: params.id },
    });
  });
});
