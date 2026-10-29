const corporateUser = require('../../../entities/corporateUser')
const { updateDailyReport } = require('../../corporateUser')

jest.mock('../../../entities/corporateUser', () => ({
  findOne:jest.fn(),
  hasOne:jest.fn(),
  update:jest.fn(),

}));
describe('update Daily Report', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update the dailyReport and return the updated user', async () => {
    corporateUser.findOne.mockResolvedValue({
      dailyReport: { currentStatus: 'oldStatus' },
    });

    corporateUser.update.mockResolvedValue([1]); 

    const result = await updateDailyReport(1, { newStatus: 'newStatus' });

    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: 1,
      },
    });

    expect(corporateUser.update).toHaveBeenCalledWith(
      { dailyReport: { currentStatus: 'oldStatus', newStatus: 'newStatus' } },
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

    await expect(updateDailyReport(1, { newStatus: 'newStatus' }))
      .rejects.toThrow('Failed to update dailyReport'); 

    expect(corporateUser.update).not.toHaveBeenCalled();
  });

  it('should throw an error if the update fails', async () => {
    corporateUser.findOne.mockResolvedValue({
      dailyReport: { currentStatus: 'oldStatus' },
    });

    corporateUser.update.mockRejectedValue(new Error('Database Error'));

    await expect(updateDailyReport(1, { newStatus: 'newStatus' })).rejects.toThrow('Failed to update dailyReport');
  });

  it('should handle invalid data gracefully', async () => {
    corporateUser.findOne.mockResolvedValue({
      dailyReport: { currentStatus: 'oldStatus' },
    });

    corporateUser.update.mockResolvedValue([1]); 

    await expect(updateDailyReport(1, null)).resolves.toEqual([1]);
    await expect(updateDailyReport(1, undefined)).resolves.toEqual([1]);

    expect(corporateUser.update).toHaveBeenCalledWith(
      { dailyReport: { currentStatus: 'oldStatus', ...null } },
      {
        where: {
          credentialId: 1,
        },
      }
    );
    expect(corporateUser.update).toHaveBeenCalledWith(
      { dailyReport: { currentStatus: 'oldStatus', ...undefined } },
      {
        where: {
          credentialId: 1,
        },
      }
    );
  });
});