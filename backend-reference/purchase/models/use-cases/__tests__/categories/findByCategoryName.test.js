const { findByCategoryName } = require('../../../use-cases/categories')
const categories = require('../../../entities/categories')

jest.mock('../../../entities/categories', () => ({
     findOne: jest.fn(),
}))
jest.mock('../../../entities/products', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/softwares', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () =>({
     belongsTo: jest.fn(),
     }));

describe('findByCategoryName Use-Case', () => {
     beforeEach(() => {
          jest.clearAllMocks()
     })

     it('should find and return a category by category name', async () => {
          const categoryName = 'Example Category'
          const expectedCategory = {
               id: 1,
               categoryName: 'Example Category',
               categoryImage: 'https://peko-storage.s3.me-central-1.amazonaws.com/sachin/b275b086-0db8-4c7d-b862-6b324638fa67f1.jpeg',
               categoryStatus: 1,
               createdAt: '2023-02-22 05:43:57',
               updatedAt: '2023-02-22 05:43:57',
               vendorId: 12,
          }

          categories.findOne.mockResolvedValue(expectedCategory)

          const result = await findByCategoryName(categoryName)

          expect(categories.findOne).toHaveBeenCalledWith({
               where: {
                    categoryName: categoryName,
               },
          })
          expect(result).toEqual(expectedCategory)
     })

     it('should return null if no category is found', async () => {
          const categoryName = 'Nonexistent Category'

          categories.findOne.mockResolvedValue(null)

          const result = await findByCategoryName(categoryName)

          expect(categories.findOne).toHaveBeenCalledWith({
               where: {
                    categoryName: categoryName,
               },
          })
          expect(result).toBeNull()
     })

     it('should handle errors and return false', async () => {
          const categoryName = 'Error Category';
          const expectedError = new Error('Database error');
      
          // Mock the findOne function to reject with the expected error
          categories.findOne.mockRejectedValue(expectedError);
      
          // Test that the findByCategoryName function rejects with the expected error
          await expect(findByCategoryName(categoryName)).rejects.toThrow(expectedError);
      
          // Ensure that the findOne method was called with the correct parameters
          expect(categories.findOne).toHaveBeenCalledWith({
              where: { categoryName: categoryName },
          });
      });
      
})
