const sequelize = require('../../../../configs/database/index')
const { updateWeeklyStatus } = require('../../corporateUser')
const { QueryTypes } = require('sequelize')

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
 jest.mock('../../../entities/systemUser', () => ({
     belongsTo: jest.fn(),
}))
jest.mock('../../../entities/credential', () => ({
     belongsTo: jest.fn(),
}))
jest.mock('../../../entities/subscription', () => ({
     belongsTo: jest.fn(),
}))
jest.mock('../../../entities/corporateUser', () => ({
     belongsTo: jest.fn(),
}))
jest.mock('../../../entities/package', () => ({
     belongsTo: jest.fn(),
}))
jest.mock('../../../entities/serviceOperator', () => ({
  belongsTo: jest.fn(),
}))
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}))
jest.mock('../../../entities/order', () => ({
  belongsTo: jest.fn(),
}))
jest.mock('../../../entities/transaction', () => ({
  belongsTo: jest.fn(),
}))
jest.mock('../../../../configs/database/index', () => ({
     query: jest.fn(),
     define: jest.fn(),
}))

describe('update Weekly Status', () => {
     afterEach(() => {
          jest.clearAllMocks()
     })

     it('should successfully update the weeklyReport status and return true', async () => {
          sequelize.query.mockResolvedValue([1])

          const result = await updateWeeklyStatus(1, true)

          expect(sequelize.query).toHaveBeenCalledWith(
               `
      UPDATE corporateUsers
      SET weeklyReport = JSON_SET(weeklyReport, '$.isActive', :isActive)
      WHERE credentialId = :id
    `,
               {
                    replacements: { id: 1, isActive: true },
                    type: QueryTypes.UPDATE,
               }
          )
          expect(result).toBe(true)
     })

     it('should throw an error if the update fails', async () => {
          sequelize.query.mockRejectedValue(new Error('Database Error'))

          await expect(updateWeeklyStatus(1, true)).rejects.toThrow('Failed to update weeklyStatus')
     })

     it('should handle invalid id values', async () => {
          sequelize.query.mockResolvedValue([0])

          await expect(updateWeeklyStatus(null, true)).resolves.toBe(true)
          await expect(updateWeeklyStatus(undefined, true)).resolves.toBe(true)
          await expect(updateWeeklyStatus('string', true)).resolves.toBe(true)
     })

     it('should correctly handle different isActive values', async () => {
          sequelize.query.mockResolvedValue([1])

          await Promise.all([updateWeeklyStatus(1, true), updateWeeklyStatus(1, false)])

          expect(sequelize.query).toHaveBeenCalledWith(
               `
      UPDATE corporateUsers
      SET weeklyReport = JSON_SET(weeklyReport, '$.isActive', :isActive)
      WHERE credentialId = :id
    `,
               {
                    replacements: { id: 1, isActive: true },
                    type: QueryTypes.UPDATE,
               }
          )

          expect(sequelize.query).toHaveBeenCalledWith(
               `
      UPDATE corporateUsers
      SET weeklyReport = JSON_SET(weeklyReport, '$.isActive', :isActive)
      WHERE credentialId = :id
    `,
               {
                    replacements: { id: 1, isActive: false },
                    type: QueryTypes.UPDATE,
               }
          )
     })

     it('should resolve successfully even if no rows are updated', async () => {
          sequelize.query.mockResolvedValue([0])

          await expect(updateWeeklyStatus(1, true)).resolves.toBe(true)
     })
})
