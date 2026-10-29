const { findCorporateUserData } = require('../../corporateUser');
const corporateUser = require('../../../entities/corporateUser');

jest.mock('../../../entities/corporateUser', () => ({
  findAll: jest.fn(), // Explicitly mock findAll method here
}));

describe('find Corporate User Data', () => {

  it('should retrieve corporate user data by credentialId', async () => {
    const mockData = [
      { name: 'John Doe', email: 'john.doe@example.com', dailyReport: true, weeklyReport: false, monthlyReport: true },
    ];

    // Mocking the findAll method
    corporateUser.findAll.mockResolvedValue(mockData);

    const id = 1;
    const result = await findCorporateUserData(id);

    expect(result).toEqual(mockData);
    expect(corporateUser.findAll).toHaveBeenCalledWith({
      where: {
        credentialId: id,
      },
      attributes: ['name', 'email', 'dailyReport', 'weeklyReport', 'monthlyReport'],
    });
  });

  it('should return an empty array if no data is found', async () => {
    corporateUser.findAll.mockResolvedValue([]);

    const id = 999;
    const result = await findCorporateUserData(id);

    expect(result).toEqual([]);
    expect(corporateUser.findAll).toHaveBeenCalledWith({
      where: {
        credentialId: id,
      },
      attributes: ['name', 'email', 'dailyReport', 'weeklyReport', 'monthlyReport'],
    });
  });

  it('should handle errors thrown during the database query', async () => {
    const errorMessage = 'Database error';
    corporateUser.findAll.mockRejectedValue(new Error(errorMessage));

    const id = 1;

    await expect(findCorporateUserData(id)).rejects.toThrow(errorMessage);
    expect(corporateUser.findAll).toHaveBeenCalledWith({
      where: {
        credentialId: id,
      },
      attributes: ['name', 'email', 'dailyReport', 'weeklyReport', 'monthlyReport'],
    });
  });

});
