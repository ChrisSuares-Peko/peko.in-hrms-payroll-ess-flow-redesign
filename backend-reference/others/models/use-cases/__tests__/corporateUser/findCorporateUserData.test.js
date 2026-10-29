const { findCorporateUserData } = require('../../corporateUser');
const  corporateUser = require('../../../entities/corporateUser');

jest.mock('../../../entities/corporateUser', () => ({
  findOne:jest.fn(),
  hasOne:jest.fn(),
}));
describe('find Corporate User Data', () => {

  it('should retrieve corporate user data by credentialId', async () => {

    const mockData = [
      { name: 'John Doe', email: 'john.doe@example.com', dailyReport: true, weeklyReport: false, monthlyReport: true },
    ];

    corporateUser.findOne.mockResolvedValue(mockData);

    const id = 1;
    const result = await findCorporateUserData(id);

    expect(result).toEqual(mockData);

    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: id,
      },
      attributes: ['name', 'email', 'dailyReport', 'weeklyReport', 'monthlyReport'],
    });
  });

  it('should return an empty array if no data is found', async () => {
    corporateUser.findOne.mockResolvedValue([]);

    const id = 999; 
    const result = await findCorporateUserData(id);

    expect(result).toEqual([]);

    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: id,
      },
      attributes: ['name', 'email', 'dailyReport', 'weeklyReport', 'monthlyReport'],
    });
  });

  it('should handle errors thrown during the database query', async () => {
    const errorMessage = 'Database error';
    corporateUser.findOne.mockRejectedValue(new Error(errorMessage));

    const id = 1;

    await expect(findCorporateUserData(id)).rejects.toThrow(errorMessage);

    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: id,
      },
      attributes: ['name', 'email', 'dailyReport', 'weeklyReport', 'monthlyReport'],
    });
  });

});
