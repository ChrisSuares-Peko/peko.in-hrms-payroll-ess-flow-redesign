const { findCorporateUserData } = require('../../corporateUser');
const  corporateUser = require('../../../entities/corporateUser');

jest.mock('@logtail/node', () => {
  return {
      Logtail: jest.fn().mockImplementation(() => {
          return {
              // Mock methods of Logtail if needed
              info: jest.fn(),
              error: jest.fn(),
          };
      }),
  };
});



describe('find Corporate User Data', () => {

  it('should retrieve corporate user data by credentialId', async () => {

    const mockData = [
      { name: 'John Doe',id:"123",email: 'john.doe@example.com',city:"",  dailyReport: true, weeklyReport: false, monthlyReport: true },
    ];

    corporateUser.findOne.mockResolvedValue(mockData);

    const id = 1;
    const result = await findCorporateUserData(id);

    expect(result).toEqual(mockData);

    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: id,
      },
      attributes: ['id','name', 'email','city', 'dailyReport', 'weeklyReport', 'monthlyReport'],
    });
  });

  it('should return an empty array if no data is found', async () => {
    corporateUser.findOne.mockResolvedValue([]);

    const id = 1; 
    const result = await findCorporateUserData(id);

    expect(result).toEqual([]);

    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: id,
      },
      attributes: ['id','name', 'email','city', 'dailyReport', 'weeklyReport', 'monthlyReport'],
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
      attributes: ['id','name', 'email','city', 'dailyReport', 'weeklyReport', 'monthlyReport'],
    });
  });

});
