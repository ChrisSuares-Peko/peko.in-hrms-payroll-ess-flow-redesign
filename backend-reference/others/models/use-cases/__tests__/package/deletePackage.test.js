const { deletePackage } = require('../../package')
const pkgModel = require('../../../entities/package')


describe('delete package', () => {
     beforeEach(() => {
          jest.clearAllMocks()
     })

     it('should successfully delete a package and return the number of deleted rows', async () => {
          const params = { id: 1 }
          const expectedDeletedRows = 1 
          pkgModel.destroy.mockResolvedValue(expectedDeletedRows)

          const result = await deletePackage(params)

          expect(pkgModel.destroy).toHaveBeenCalledWith({
               where: { id: params.id },
          })
          expect(result).toEqual(expectedDeletedRows)
     })

     it('should handle cases where no rows are deleted', async () => {
          const params = { id: 2 }
          const expectedDeletedRows = 0

          pkgModel.destroy.mockResolvedValue(expectedDeletedRows)

          const result = await deletePackage(params)

          expect(pkgModel.destroy).toHaveBeenCalledWith({
               where: { id: params.id },
          })
          expect(result).toEqual(expectedDeletedRows)
     })

     
      
})
