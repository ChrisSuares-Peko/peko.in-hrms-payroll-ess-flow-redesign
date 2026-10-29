const { findEachCorporateUserData } = require('../../corporateUser');
const corporateUser = require('../../../entities/corporateUser');
const { Op, Sequelize } = require('sequelize');

// Explicitly mock findAll method inside the mock
jest.mock('../../../entities/corporateUser', () => ({
  findAll: jest.fn(),  // Mock findAll explicitly
}));

describe('findEachCorporateUserData', () => {

  it('should retrieve corporate user data by credentialId and dailyReport.isActive is true', async () => {
    const mockData = [
      { name: 'John Doe', email: 'john.doe@example.com', dailyReport: { isActive: true }, weeklyReport: false, monthlyReport: true },
    ];

    // Mocking the findAll method
    corporateUser.findAll.mockResolvedValue(mockData);

    const id = 1;
    const result = await findEachCorporateUserData(id);

    expect(result).toEqual(mockData);

    expect(corporateUser.findAll).toHaveBeenCalledWith({
      where: {
        credentialId: id,
        [Op.and]: Sequelize.literal(`dailyReport->>'$.isActive' = 'true'`),
      },
      attributes: ['name', 'email', 'dailyReport', 'weeklyReport', 'monthlyReport'],
    });
  });

  it('should return an empty array if no data matches the condition', async () => {
    corporateUser.findAll.mockResolvedValue([]);

    const id = 1;
    const result = await findEachCorporateUserData(id);

    expect(result).toEqual([]);

    expect(corporateUser.findAll).toHaveBeenCalledWith({
      where: {
        credentialId: id,
        [Op.and]: Sequelize.literal(`dailyReport->>'$.isActive' = 'true'`),
      },
      attributes: ['name', 'email', 'dailyReport', 'weeklyReport', 'monthlyReport'],
    });
  });

  it('should return an empty array if no data is found for the given credentialId', async () => {
    corporateUser.findAll.mockResolvedValue([]);

    const id = 999; 
    const result = await findEachCorporateUserData(id);

    expect(result).toEqual([]);

    expect(corporateUser.findAll).toHaveBeenCalledWith({
      where: {
        credentialId: id,
        [Op.and]: Sequelize.literal(`dailyReport->>'$.isActive' = 'true'`),
      },
      attributes: ['name', 'email', 'dailyReport', 'weeklyReport', 'monthlyReport'],
    });
  });

  it('should handle errors thrown during the database query', async () => {
    const errorMessage = 'Database error';
    corporateUser.findAll.mockRejectedValue(new Error(errorMessage));

    const id = 1;

    await expect(findEachCorporateUserData(id)).rejects.toThrow(errorMessage);

    expect(corporateUser.findAll).toHaveBeenCalledWith({
      where: {
        credentialId: id,
        [Op.and]: Sequelize.literal(`dailyReport->>'$.isActive' = 'true'`),
      },
      attributes: ['name', 'email', 'dailyReport', 'weeklyReport', 'monthlyReport'],
    });
  });

});
