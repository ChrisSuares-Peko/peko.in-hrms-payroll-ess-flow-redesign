const corporateUser = require('../../../entities/corporateUser')
const packAge = require('../../../entities/package')
const { findOne } = require('../../corporateUser')


jest.mock('../../../entities/corporateUser', () => ({
     hasOne: jest.fn(),
     findOne: jest.fn()
 }));
describe('find corporate user', () => {
     beforeEach(() => {
          jest.clearAllMocks()
     })
     it('should successfully retrieve a corporate user with no attributes specified', async () => {
          const params = { id: 1 }
          const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' }

          corporateUser.findOne.mockResolvedValue(mockUser)

          const result = await findOne(params)

          expect(corporateUser.findOne).toHaveBeenCalledWith({
               include: [{ model: packAge }],
               where: { credentialId: params.id },
               attributes: undefined,
               nest: true,
               raw: true,
          })
          expect(result).toEqual(mockUser)
     })

     it('should successfully retrieve a corporate user with specific attributes', async () => {
          const params = { id: 1 }
          const attributes = ['name', 'email']
          const mockUser = { name: 'John Doe', email: 'john@example.com' }

          corporateUser.findOne.mockResolvedValue(mockUser)

          const result = await findOne(params, attributes)

          expect(corporateUser.findOne).toHaveBeenCalledWith({
               include: [{ model: packAge }],
               where: { credentialId: params.id },
               attributes,
               nest: true,
               raw: true,
          })
          expect(result).toEqual(mockUser)
     })

     it('should handle when no corporate user is found', async () => {
          const params = { id: 1 }

          corporateUser.findOne.mockResolvedValue(null)

          const result = await findOne(params)

          expect(corporateUser.findOne).toHaveBeenCalledWith({
               include: [{ model: packAge }],
               where: { credentialId: params.id },
               attributes: undefined,
               nest: true,
               raw: true,
          })
          expect(result).toBeNull()
     })
     it('should handle errors thrown by corporateUser.findOne', async () => {
          const params = { id: 1 }
          const error = new Error('Database error')

          corporateUser.findOne.mockRejectedValue(error)

          await expect(findOne(params)).rejects.toThrow(error)
     })

     it('should handle attributes explicitly set to undefined', async () => {
          const params = { id: 1 }

          corporateUser.findOne.mockResolvedValue({ id: 1, name: 'John Doe' })

          const result = await findOne(params, undefined)

          expect(corporateUser.findOne).toHaveBeenCalledWith({
               include: [{ model: packAge }],
               where: { credentialId: params.id },
               attributes: undefined,
               nest: true,
               raw: true,
          })
          expect(result).toEqual({ id: 1, name: 'John Doe' })
     })

     it('should handle when params is undefined', async () => {
          const attributes = ['name', 'email']

          await expect(findOne(undefined, attributes)).rejects.toThrow(TypeError)
     })

     it('should handle when params is an empty object', async () => {
          const params = {}
          const attributes = ['name', 'email']
          const mockUser = null

          corporateUser.findOne.mockResolvedValue(mockUser)

          const result = await findOne(params, attributes)

          expect(corporateUser.findOne).toHaveBeenCalledWith({
               include: [{ model: packAge }],
               where: {},
               attributes,
               nest: true,
               raw: true,
          })
          expect(result).toBe(mockUser)
     })
})
