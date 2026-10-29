const corporateUser = require('../../../entities/corporateUser')
const { updateMonthlyReport } = require('../../corporateUser')
const { monthlyReportScheduler } = require('../../../../services/scheduleReports')
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

describe('updateMonthlyReport', () => {
     afterEach(() => {
          jest.clearAllMocks()
     })

     it('should successfully update the monthlyReport and return the updated user', async () => {
      const mockExistingUserData = { monthlyReport: { currentStatus: 'oldStatus' } };
      const mockUpdatedUser = { name: 'Test User', credentialId: 1, monthlyReport: { currentStatus: 'oldStatus', newStatus: 'newStatus' } };
  
      corporateUser.findOne.mockResolvedValue(mockExistingUserData);
      corporateUser.update.mockResolvedValue([1]);
      corporateUser.findOne.mockResolvedValue(mockUpdatedUser);
  
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
  
      expect(corporateUser.findOne).toHaveBeenCalledWith({
        where: {
          credentialId: 1,
        },
        attributes: ["name", "credentialId", "monthlyReport"],
      });
  
      expect(monthlyReportScheduler).toHaveBeenCalledWith(mockUpdatedUser);
      expect(result).toEqual(mockUpdatedUser);
    });
  
    it('should handle non-existent user gracefully', async () => {
      corporateUser.findOne.mockResolvedValue(null); // No user found in DB
    
      await expect(updateMonthlyReport(1, { newStatus: 'newStatus' }))
        .rejects.toThrow('Failed to update monthlyReport');
    
      expect(corporateUser.findOne).toHaveBeenCalledWith({
        where: {
          credentialId: 1,
        },
      });
    
      expect(corporateUser.update).not.toHaveBeenCalled();
      expect(monthlyReportScheduler).not.toHaveBeenCalled();
    });
    
    
    
  
    it('should throw an error if the update fails', async () => {
      const mockExistingUserData = { monthlyReport: { currentStatus: 'oldStatus' } };
  
      corporateUser.findOne.mockResolvedValue(mockExistingUserData);
      corporateUser.update.mockRejectedValue(new Error('Database Error'));
  
      await expect(updateMonthlyReport(1, { newStatus: 'newStatus' }))
        .rejects.toThrow('Failed to update monthlyReport');
  
      expect(corporateUser.update).toHaveBeenCalled();
      expect(monthlyReportScheduler).not.toHaveBeenCalled();
    });
  
    it('should handle empty data gracefully', async () => {
      const mockExistingUserData = { monthlyReport: { currentStatus: 'oldStatus' } };
      const mockUpdatedUser = { name: 'Test User', credentialId: 1, monthlyReport: { currentStatus: 'oldStatus' } };
  
      corporateUser.findOne.mockResolvedValue(mockExistingUserData);
      corporateUser.update.mockResolvedValue([1]);
      corporateUser.findOne.mockResolvedValue(mockUpdatedUser);
  
      const result = await updateMonthlyReport(1, {});
  
      expect(corporateUser.findOne).toHaveBeenCalledWith({
        where: {
          credentialId: 1,
        },
      });
  
      expect(corporateUser.update).toHaveBeenCalledWith(
        { monthlyReport: { currentStatus: 'oldStatus' } },
        {
          where: {
            credentialId: 1,
          },
        }
      );
  
      expect(result).toEqual(mockUpdatedUser);
    });
  
    it('should handle null data gracefully', async () => {
      const mockExistingUserData = { monthlyReport: { currentStatus: 'oldStatus' } };
      const mockUpdatedUser = { name: 'Test User', credentialId: 1, monthlyReport: { currentStatus: 'oldStatus' } };
  
      corporateUser.findOne.mockResolvedValue(mockExistingUserData);
      corporateUser.update.mockResolvedValue([1]);
      corporateUser.findOne.mockResolvedValue(mockUpdatedUser);
  
      const result = await updateMonthlyReport(1, null);
  
      expect(corporateUser.findOne).toHaveBeenCalledWith({
        where: {
          credentialId: 1,
        },
      });
  
      expect(corporateUser.update).toHaveBeenCalledWith(
        { monthlyReport: { currentStatus: 'oldStatus' } },
        {
          where: {
            credentialId: 1,
          },
        }
      );
  
      expect(result).toEqual(mockUpdatedUser);
    });
  
    it('should handle invalid data types gracefully', async () => {
      const mockExistingUserData = { monthlyReport: { currentStatus: 'oldStatus' } };
      const mockUpdatedUser = { name: 'Test User', credentialId: 1, monthlyReport: { currentStatus: 'oldStatus' } };
  
      corporateUser.findOne.mockResolvedValue(mockExistingUserData);
      corporateUser.update.mockResolvedValue([1]);
      corporateUser.findOne.mockResolvedValue(mockUpdatedUser);
  
      const invalidData = [123, 'string', true, {}]; // List of invalid data types
  
      for (const data of invalidData) {
        const result = await updateMonthlyReport(1, data);
  
        expect(corporateUser.findOne).toHaveBeenCalledWith({
          where: {
            credentialId: 1,
          },
        });
  
        expect(corporateUser.update).toHaveBeenCalledWith(
          { monthlyReport: { currentStatus: 'oldStatus' } },
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
