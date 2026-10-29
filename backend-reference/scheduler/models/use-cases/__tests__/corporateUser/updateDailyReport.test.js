const corporateUser = require('../../../entities/corporateUser')
const { updateDailyReport } = require('../../corporateUser')
const { dailyReportScheduler } = require('../../../../services/scheduleReports')

jest.mock('../../../../services/scheduleReports')
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
describe('updateDailyReport', () => {
     afterEach(() => {
          jest.clearAllMocks()
     })

     it('should successfully update the dailyReport and return the updated user', async () => {
          const mockExistingUserData = { dailyReport: { currentStatus: 'oldStatus' } }
          const mockUpdatedUser = { name: 'Test User', credentialId: 1, dailyReport: { currentStatus: 'oldStatus', newStatus: 'newStatus' } }

          corporateUser.findOne.mockResolvedValue(mockExistingUserData)
          corporateUser.update.mockResolvedValue([1])
          corporateUser.findOne.mockResolvedValue(mockUpdatedUser)

          const result = await updateDailyReport(1, { newStatus: 'newStatus' })

          expect(corporateUser.findOne).toHaveBeenCalledWith({
               where: {
                    credentialId: 1,
               },
          })

          expect(corporateUser.update).toHaveBeenCalledWith(
               { dailyReport: { currentStatus: 'oldStatus', newStatus: 'newStatus' } },
               {
                    where: {
                         credentialId: 1,
                    },
               }
          )

          expect(corporateUser.findOne).toHaveBeenCalledWith({
               where: {
                    credentialId: 1,
               },
               attributes: ['name', 'credentialId', 'dailyReport'],
          })

          expect(dailyReportScheduler).toHaveBeenCalledWith(mockUpdatedUser)
          expect(result).toEqual(mockUpdatedUser)
     })

     it('should handle the case where no user is found for the given id', async () => {
          corporateUser.findOne.mockResolvedValue(null)

          await expect(updateDailyReport(1, { newStatus: 'newStatus' })).rejects.toThrow('Failed to update dailyReport')

          expect(corporateUser.update).not.toHaveBeenCalled()
          expect(dailyReportScheduler).not.toHaveBeenCalled()
     })

     it('should throw an error if the update fails', async () => {
          const mockExistingUserData = { dailyReport: { currentStatus: 'oldStatus' } }

          corporateUser.findOne.mockResolvedValue(mockExistingUserData)
          corporateUser.update.mockRejectedValue(new Error('Database Error'))

          await expect(updateDailyReport(1, { newStatus: 'newStatus' })).rejects.toThrow('Failed to update dailyReport')

          expect(corporateUser.update).toHaveBeenCalled()
          expect(dailyReportScheduler).not.toHaveBeenCalled()
     })

     it('should handle null data gracefully', async () => {
          const mockExistingUserData = { dailyReport: { currentStatus: 'oldStatus' } }
          const mockUpdatedUser = { name: 'Test User', credentialId: 1, dailyReport: { currentStatus: 'oldStatus' } }

          corporateUser.findOne.mockResolvedValue(mockExistingUserData)
          corporateUser.update.mockResolvedValue([1])
          corporateUser.findOne.mockResolvedValue(mockUpdatedUser)

          const result = await updateDailyReport(1, null)

          expect(corporateUser.findOne).toHaveBeenCalledWith({
               where: {
                    credentialId: 1,
               },
          })

          expect(corporateUser.update).toHaveBeenCalledWith(
               { dailyReport: { currentStatus: 'oldStatus' } },
               {
                    where: {
                         credentialId: 1,
                    },
               }
          )

          expect(result).toEqual(mockUpdatedUser)
     })
})
