const corporateUser = require('../../../entities/corporateUser')
const { updateWeeklyReport } = require('../../corporateUser')
const { weeklyReportScheduler } = require('../../../../services/scheduleReports')

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
jest.mock('../../../../services/scheduleReports')

describe('update Weekly Report', () => {
     afterEach(() => {
          jest.clearAllMocks()
     })

     it('should successfully update the weeklyReport and return the updated user', async () => {
      const mockExistingUserData = { weeklyReport: { currentStatus: 'oldStatus' } };
      const mockUpdatedUser = { name: 'Test User', credentialId: 1, weeklyReport: { currentStatus: 'oldStatus', newStatus: 'newStatus' } };
  
      corporateUser.findOne.mockResolvedValue(mockExistingUserData);
      corporateUser.update.mockResolvedValue([1]);
      corporateUser.findOne.mockResolvedValue(mockUpdatedUser);
  
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
  
      expect(corporateUser.findOne).toHaveBeenCalledWith({
        where: {
          credentialId: 1,
        },
        attributes: ["name", "credentialId", "weeklyReport"],
      });
  
      expect(weeklyReportScheduler).toHaveBeenCalledWith(mockUpdatedUser);
      expect(result).toEqual(mockUpdatedUser);
    });
  
    it('should handle the case where no user is found for the given id', async () => {
      corporateUser.findOne.mockResolvedValue(null);
  
      await expect(updateWeeklyReport(1, { newStatus: 'newStatus' }))
        .rejects.toThrow('Failed to update weeklyReport');
  
      expect(corporateUser.update).not.toHaveBeenCalled();
      expect(weeklyReportScheduler).not.toHaveBeenCalled();
    });
  
    it('should throw an error if the update fails', async () => {
      const mockExistingUserData = { weeklyReport: { currentStatus: 'oldStatus' } };
  
      corporateUser.findOne.mockResolvedValue(mockExistingUserData);
      corporateUser.update.mockRejectedValue(new Error('Database Error'));
  
      await expect(updateWeeklyReport(1, { newStatus: 'newStatus' }))
        .rejects.toThrow('Failed to update weeklyReport');
  
      expect(corporateUser.update).toHaveBeenCalled();
      expect(weeklyReportScheduler).not.toHaveBeenCalled();
    });
  
    it('should handle empty data gracefully', async () => {
      const mockExistingUserData = { weeklyReport: { currentStatus: 'oldStatus' } };
      const mockUpdatedUser = { name: 'Test User', credentialId: 1, weeklyReport: { currentStatus: 'oldStatus' } };
  
      corporateUser.findOne.mockResolvedValue(mockExistingUserData);
      corporateUser.update.mockResolvedValue([1]);
      corporateUser.findOne.mockResolvedValue(mockUpdatedUser);
  
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
  
      expect(result).toEqual(mockUpdatedUser);
    });
  
    it('should handle null data gracefully', async () => {
      const mockExistingUserData = { weeklyReport: { currentStatus: 'oldStatus' } };
      const mockUpdatedUser = { name: 'Test User', credentialId: 1, weeklyReport: { currentStatus: 'oldStatus' } };
  
      corporateUser.findOne.mockResolvedValue(mockExistingUserData);
      corporateUser.update.mockResolvedValue([1]);
      corporateUser.findOne.mockResolvedValue(mockUpdatedUser);
  
      const result = await updateWeeklyReport(1, null);
  
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
  
      expect(result).toEqual(mockUpdatedUser);
    });
  
    it('should handle invalid data types gracefully', async () => {
      const mockExistingUserData = { weeklyReport: { currentStatus: 'oldStatus' } };
      const mockUpdatedUser = { name: 'Test User', credentialId: 1, weeklyReport: { currentStatus: 'oldStatus' } };
  
      corporateUser.findOne.mockResolvedValue(mockExistingUserData);
      corporateUser.update.mockResolvedValue([1]);
      corporateUser.findOne.mockResolvedValue(mockUpdatedUser);
  
      const invalidData = [123, 'string', true, {}]; // List of invalid data types
  
      for (const data of invalidData) {
        const result = await updateWeeklyReport(1, data);
  
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
  
        expect(result).toEqual(mockUpdatedUser);
      }
    });
})
