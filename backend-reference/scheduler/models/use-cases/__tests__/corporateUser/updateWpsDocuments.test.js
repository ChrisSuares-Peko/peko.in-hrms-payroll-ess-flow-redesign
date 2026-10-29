const CorporateUser = require('../../../entities/corporateUser')
const { updateWpsDocuments } = require('../../payroll/corporateUser')

jest.mock('../../../entities/corporateUser', () => ({
     findByIdAndUpdate: jest.fn(),
}))

describe('updateWpsDocuments', () => {
     afterEach(() => {
          jest.clearAllMocks()
     })

     it('should successfully update wps documents and return the updated wps data', async () => {
          const mockDocuments = { document1: 'url1', document2: 'url2' }
          const mockUpdatedUser = {
               wps: {
                    registrationStatus: 'INPROGRESS',
                    wpsDocuments: mockDocuments,
               },
          }

          CorporateUser.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser)

          const result = await updateWpsDocuments(1, mockDocuments)

          expect(CorporateUser.findByIdAndUpdate).toHaveBeenCalledWith(
               1,
               {
                    $set: {
                         'wps.registrationStatus': 'INPROGRESS',
                         'wps.wpsDocuments': mockDocuments,
                    },
               },
               { new: true }
          )

          expect(result).toEqual(mockUpdatedUser.wps)
     })

     it('should handle the case where no user is found for the given ID', async () => {
          CorporateUser.findByIdAndUpdate.mockResolvedValue(null)

          await expect(updateWpsDocuments(1, { document1: 'url1' })).rejects.toThrow('Failed to update wps documents')

          expect(CorporateUser.findByIdAndUpdate).toHaveBeenCalledWith(
               1,
               {
                    $set: {
                         'wps.registrationStatus': 'INPROGRESS',
                         'wps.wpsDocuments': { document1: 'url1' },
                    },
               },
               { new: true }
          )
     })

     it('should throw an error if the update operation fails', async () => {
          CorporateUser.findByIdAndUpdate.mockRejectedValue(new Error('Database Error'))

          await expect(updateWpsDocuments(1, { document1: 'url1' })).rejects.toThrow('Failed to update wps documents Database Error')

          expect(CorporateUser.findByIdAndUpdate).toHaveBeenCalled()
     })

     it('should handle empty documents gracefully', async () => {
          const mockUpdatedUser = {
               wps: {
                    registrationStatus: 'INPROGRESS',
                    wpsDocuments: {},
               },
          }

          CorporateUser.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser)

          const result = await updateWpsDocuments(1, {})

          expect(CorporateUser.findByIdAndUpdate).toHaveBeenCalledWith(
               1,
               {
                    $set: {
                         'wps.registrationStatus': 'INPROGRESS',
                         'wps.wpsDocuments': {},
                    },
               },
               { new: true }
          )

          expect(result).toEqual(mockUpdatedUser.wps)
     })

     it('should handle null documents gracefully', async () => {
          const mockUpdatedUser = {
               wps: {
                    registrationStatus: 'INPROGRESS',
                    wpsDocuments: null,
               },
          }

          CorporateUser.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser)

          const result = await updateWpsDocuments(1, null)

          expect(CorporateUser.findByIdAndUpdate).toHaveBeenCalledWith(
               1,
               {
                    $set: {
                         'wps.registrationStatus': 'INPROGRESS',
                         'wps.wpsDocuments': null,
                    },
               },
               { new: true }
          )

          expect(result).toEqual(mockUpdatedUser.wps)
     })

     it('should throw an error if userId is missing', async () => {
      const documents = { document1: 'url1' };
  
      await expect(updateWpsDocuments(undefined, documents))
        .rejects.toThrow('User ID is required');
  
      await expect(updateWpsDocuments(null, documents))
        .rejects.toThrow('User ID is required');
    });
})
