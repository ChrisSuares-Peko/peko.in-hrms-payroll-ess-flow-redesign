const corporateUser = require('../../../entities/corporateUser')
const { updateMonthlyReport } = require('../../corporateUser')

jest.mock('../../../entities/corporateUser', () => ({
  findOne:jest.fn(),
  hasOne:jest.fn(),
  update:jest.fn(),

}));
describe('updateMonthlyReport', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update the monthlyReport and return the updated user', async () => {
    corporateUser.findOne.mockResolvedValue({
      monthlyReport: { currentStatus: 'oldStatus' },
    });

    corporateUser.update.mockResolvedValue([1]); 

    const result = await updateMonthlyReport(1, { newStatus: 'newStatus' });

    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: {
        credentialId: 1,
      },
    });

    expect(corporateUser.update).toHaveBeenCalledWith(
      { monthlyReport: { currentStatus: 'oldStatus', newStatus: 'newStatus' } },
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

    await expect(updateMonthlyReport(1, { newStatus: 'newStatus' }))
      .rejects.toThrow('Failed to update monthlyReport'); 

    expect(corporateUser.update).not.toHaveBeenCalled();
  });

  it('should throw an error if the update fails', async () => {
    corporateUser.findOne.mockResolvedValue({
      monthlyReport: { currentStatus: 'oldStatus' },
    });

    corporateUser.update.mockRejectedValue(new Error('Database Error'));

    await expect(updateMonthlyReport(1, { newStatus: 'newStatus' })).rejects.toThrow('Failed to update monthlyReport');
  });

  it('should handle invalid data gracefully', async () => {
    corporateUser.findOne.mockResolvedValue({
      monthlyReport: { currentStatus: 'oldStatus' },
    });

    corporateUser.update.mockResolvedValue([1]); 

    await expect(updateMonthlyReport(1, null)).resolves.toEqual([1]);
    await expect(updateMonthlyReport(1, undefined)).resolves.toEqual([1]);

    expect(corporateUser.update).toHaveBeenCalledWith(
      { monthlyReport: { currentStatus: 'oldStatus', ...null } },
      {
        where: {
          credentialId: 1,
        },
      }
    );
    expect(corporateUser.update).toHaveBeenCalledWith(
      { monthlyReport: { currentStatus: 'oldStatus', ...undefined } },
      {
        where: {
          credentialId: 1,
        },
      }
    );
  });
});