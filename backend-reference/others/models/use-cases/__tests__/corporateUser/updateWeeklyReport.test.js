const corporateUser = require('../../../entities/corporateUser')
const { updateWeeklyReport } = require('../../corporateUser')


jest.mock('../../../entities/corporateUser', () => ({
  findOne:jest.fn(),
  hasOne:jest.fn(),
  update:jest.fn(),

}));
describe('updateWeeklyReport', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update the weeklyReport and return the updated user', async () => {
    corporateUser.findOne.mockResolvedValue({
      weeklyReport: { currentStatus: 'oldStatus' },
    });

    corporateUser.update.mockResolvedValue([1]); 

    const result = await updateWeeklyReport(1, { newStatus: 'newStatus' });

    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: 1,
      },
    });

    expect(corporateUser.update).toHaveBeenCalledWith(
      { weeklyReport: { currentStatus: 'oldStatus', newStatus: 'newStatus' } },
      {
        where: {
          credentialId: 1,
        },
      }
    );

    expect(result).toEqual([1]);
  });

  it('should handle the case where no user is found for the given id', async () => {
    corporateUser.findOne.mockResolvedValue(null);

    await expect(updateWeeklyReport(1, { newStatus: 'newStatus' }))
      .rejects.toThrow('Failed to update weeklyReport'); 

    expect(corporateUser.update).not.toHaveBeenCalled();
  });

  it('should throw an error if the update fails', async () => {
    corporateUser.findOne.mockResolvedValue({
      weeklyReport: { currentStatus: 'oldStatus' },
    });

    corporateUser.update.mockRejectedValue(new Error('Database Error'));

    await expect(updateWeeklyReport(1, { newStatus: 'newStatus' })).rejects.toThrow('Failed to update weeklyReport');
  });

  it('should handle invalid data gracefully', async () => {
    corporateUser.findOne.mockResolvedValue({
      weeklyReport: { currentStatus: 'oldStatus' },
    });

    corporateUser.update.mockResolvedValue([1]); 

    const result = await updateWeeklyReport(1, {});

    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: 1,
      },
    });

    expect(corporateUser.update).toHaveBeenCalledWith(
      { weeklyReport: { currentStatus: 'oldStatus' } },
      {
        where: {
          credentialId: 1,
        },
      }
    );

    expect(result).toEqual([1]);
  });
});