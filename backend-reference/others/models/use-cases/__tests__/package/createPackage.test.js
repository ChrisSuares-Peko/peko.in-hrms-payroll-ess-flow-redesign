const { createPackage } = require('../../package')
const pkgModel = require('../../../entities/package')


describe('createPackage Use-Case', () => {
     beforeEach(() => {
          jest.clearAllMocks()
          console.log = jest.fn() // Mock console.log
     })

     it('should successfully create a package and return the result', async () => {
          const params = { name: 'New Package' }
          const mockResponse = { id: 1, ...params }

          pkgModel.create.mockResolvedValue(mockResponse)

          const result = await createPackage(params)

          expect(pkgModel.create).toHaveBeenCalledWith(params)
          expect(result).toEqual(mockResponse)
          expect(console.log).toHaveBeenCalledWith('PACKAGE CREATE ROUTE CALLED')
     })

     it('should handle errors and log the error message', async () => {
          const params = { name: 'New Package' }
          const error = new Error('Creation failed')

          pkgModel.create.mockRejectedValue(error)

          await createPackage(params)

          expect(pkgModel.create).toHaveBeenCalledWith(params)
          expect(console.log).toHaveBeenCalledWith('Creation failed')
          expect(console.log).toHaveBeenCalledWith('PACKAGE CREATE ROUTE CALLED')
     })

     it('should handle empty parameters', async () => {
          const params = {}
          const mockResponse = { id: null }

          pkgModel.create.mockResolvedValue(mockResponse)

          const result = await createPackage(params)

          expect(pkgModel.create).toHaveBeenCalledWith(params)
          expect(result).toEqual(mockResponse)
          expect(console.log).toHaveBeenCalledWith('PACKAGE CREATE ROUTE CALLED')
     })

     it('should handle parameter validation errors', async () => {
          const params = { invalid: 'data' }
          const error = new Error('Validation failed')

          pkgModel.create.mockRejectedValue(error)

          await createPackage(params)

          expect(pkgModel.create).toHaveBeenCalledWith(params)
          expect(console.log).toHaveBeenCalledWith('Validation failed')
          expect(console.log).toHaveBeenCalledWith('PACKAGE CREATE ROUTE CALLED')
     })

     it('should handle multiple consecutive calls', async () => {
          const params1 = { name: 'Package 1' }
          const params2 = { name: 'Package 2' }

          pkgModel.create.mockResolvedValueOnce({ id: 1, ...params1 }).mockResolvedValueOnce({ id: 2, ...params2 })

          await createPackage(params1)
          await createPackage(params2)

          expect(pkgModel.create).toHaveBeenCalledWith(params1)
          expect(pkgModel.create).toHaveBeenCalledWith(params2)
          expect(console.log).toHaveBeenCalledWith('PACKAGE CREATE ROUTE CALLED')
     })
})
