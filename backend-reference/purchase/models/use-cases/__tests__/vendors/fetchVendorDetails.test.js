const { fetchVendorDetails } = require('../../vendors')
const vendor = require('../../../entities/vendor')
const { Op } = require('sequelize')

jest.mock('../../../entities/vendor', () => ({
     findAll: jest.fn(),
}))
jest.mock('../../../entities/categories', () => ({
     belongsTo: jest.fn(),
}))
jest.mock('../../../entities/serviceOperator', () => ({
     belongsTo: jest.fn(),
}))
jest.mock('../../../entities/order', () => ({
     belongsTo: jest.fn(),
}))
jest.mock('../../../entities/softwares', () => ({
     belongsTo: jest.fn(),
}))
jest.mock('../../../entities/transaction', () => ({
     belongsTo: jest.fn(),
}))

describe('fetchVendorDetails Use-Case', () => {
     beforeEach(() => {
          jest.clearAllMocks()
     })

     it('should fetch vendor details with correct parameters', async () => {
          const query = 'example'
          const type = 'retail'
          const vendors = [1, 2, 3]

          const expectedResult = [
               { id: 1, vendorName: 'Vendor A' },
               { id: 2, vendorName: 'Vendor B' },
          ]

          vendor.findAll.mockResolvedValue(expectedResult)

          const result = await fetchVendorDetails(query, type, vendors)

          expect(vendor.findAll).toHaveBeenCalledWith({
               where: {
                    vendorName: {
                         [Op.like]: `%${query}%`,
                    },
                    type,
                    id: {
                         [Op.in]: vendors,
                    },
               },
               attributes: ['id', 'vendorName'],
          })

          expect(result).toEqual(expectedResult)
     })

     it('should handle cases where type and vendors are not provided', async () => {
          const query = 'example'

          const expectedResult = [{ id: 1, vendorName: 'Vendor A' }]

          vendor.findAll.mockResolvedValue(expectedResult)

          const result = await fetchVendorDetails(query)

          expect(vendor.findAll).toHaveBeenCalledWith({
               where: {
                    vendorName: {
                         [Op.like]: `%${query}%`,
                    },
               },
               attributes: ['id', 'vendorName'],
          })

          expect(result).toEqual(expectedResult)
     })

     it('should handle errors and pass them to the next middleware', async () => {
          const query = 'example'
          const type = 'retail'
          const vendors = [1, 2, 3]

          const expectedError = new Error('Error occurred while finding vendors.')
          vendor.findAll.mockRejectedValue(expectedError)

          await expect(fetchVendorDetails(query, type, vendors)).rejects.toThrow(expectedError);

          expect(vendor.findAll).toHaveBeenCalledWith({
            where: {
              vendorName: {
                [Op.like]: `%${query}%`,
              },
              type: type,
              id: {
                [Op.in]: vendors
              }
            },
            attributes: ['id', 'vendorName'],
          });
     })
})
