const notification = require('../../../entities/notification')
const { updateNotification } = require('../../notification')

jest.mock('../../../entities/notification', () => ({
     update: jest.fn(),
}))

describe('updateNotification', () => {
     beforeEach(() => {
          jest.clearAllMocks()
     })

     it('should successfully update a notification', async () => {
          const mockResult = [1]
          const params = { id: 1 }
          const data = { title: 'Updated Title' }

          notification.update.mockResolvedValue(mockResult)

          const result = await updateNotification(params, data)

          expect(notification.update).toHaveBeenCalledWith(data, {
               where: {
                    id: params.id,
               },
          })
          expect(result).toEqual(mockResult)
     })

     it('should handle no update performed', async () => {
          const mockResult = [0]
          const params = { id: 1 }
          const data = { title: 'Updated Title' }

          notification.update.mockResolvedValue(mockResult)

          const result = await updateNotification(params, data)

          expect(notification.update).toHaveBeenCalledWith(data, {
               where: {
                    id: params.id,
               },
          })
          expect(result).toEqual(mockResult)
     })

     it('should handle errors in update', async () => {
          const error = new Error('Test Error')
          notification.update.mockRejectedValue(error)

          const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

          await updateNotification({ id: 1 }, { title: 'Updated Title' })

          expect(consoleSpy).toHaveBeenCalledWith(error)

          consoleSpy.mockRestore()
     })

     it('should log the finally block message', async () => {
          notification.update.mockResolvedValue([1])

          const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

          await updateNotification({ id: 1 }, { title: 'Updated Title' })

          expect(consoleSpy).toHaveBeenCalledWith('NOTIFICATION UPDATE ROUTE CALLED')

          consoleSpy.mockRestore()
     })

     it('should handle various params and data values', async () => {
          const mockResult = [1]

          notification.update.mockResolvedValue(mockResult)

          await updateNotification({ id: 1 }, { title: 'Updated Title' })

          expect(notification.update).toHaveBeenCalledWith(
               { title: 'Updated Title' },
               {
                    where: {
                         id: 1,
                    },
               }
          )
     })

     it('should handle invalid data gracefully', async () => {
          const mockResult = [0]
          const params = { id: 1 }
          const data = {}

          notification.update.mockResolvedValue(mockResult)

          const result = await updateNotification(params, data)

          expect(notification.update).toHaveBeenCalledWith(data, {
               where: {
                    id: params.id,
               },
          })
          expect(result).toEqual(mockResult)
     })

     it('should handle multiple field updates at once', async () => {
          const mockResult = [1]
          const params = { id: 1 }
          const data = { title: 'Updated Title', description: 'Updated Description', flag: 1 }

          notification.update.mockResolvedValue(mockResult)

          const result = await updateNotification(params, data)

          expect(notification.update).toHaveBeenCalledWith(data, {
               where: {
                    id: params.id,
               },
          })
          expect(result).toEqual(mockResult)
     })
})
