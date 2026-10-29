const { update } = require('../../software_plan')
const software_plans = require('../../../entities/software_plans')

jest.mock('../../../entities/software_plans')
jest.mock('../../../entities/subCorporateUsers', () => ({
     belongsTo: jest.fn(),
   }));
describe('update software plan', () => {
     beforeEach(() => {
          jest.clearAllMocks()
     })
     it('should update a single field', async () => {
          const params = { id: 1 }
          const data = { status: false }

          software_plans.update.mockResolvedValue([1])

          const result = await update(params, data)

          expect(software_plans.update).toHaveBeenCalledWith(data, {
               where: { id: params.id },
          })
          expect(result).toEqual([1])
     })

     it('should update multiple fields', async () => {
          const params = { id: 2 }
          const data = { name: 'New Name', price: '50.00', validity: '1 Year' }

          software_plans.update.mockResolvedValue([1])

          const result = await update(params, data)

          expect(software_plans.update).toHaveBeenCalledWith(data, {
               where: { id: params.id },
          })
          expect(result).toEqual([1])
     })

     it('should handle cases where no rows are updated', async () => {
          const params = { id: 3 }
          const data = { status: true }

          software_plans.update.mockResolvedValue([0])

          const result = await update(params, data)

          expect(software_plans.update).toHaveBeenCalledWith(data, {
               where: { id: params.id },
          })
          expect(result).toEqual([0])
     })

     it('should handle errors thrown during update', async () => {
          const params = { id: 4 }
          const data = { name: 'Error Test' }

          const expectedError = new Error('Database error')

          software_plans.update.mockRejectedValue(expectedError)

          const result = await update(params, data)

          expect(result).toBe(false)
     })

     it('should handle an empty data object', async () => {
          const params = { id: 5 };
          const data = {}; 
        
          software_plans.update.mockResolvedValue([0]);
        
          const result = await update(params, data);
        
          expect(software_plans.update).toHaveBeenCalledWith(data, {
            where: { id: params.id },
          });
          expect(result).toEqual([0]);
        });
        
        it('should handle missing id parameter', async () => {
          const params = {}; // No id provided
          const data = { status: true };
        
          const expectedError = new Error('Missing id parameter');
        
          software_plans.update.mockRejectedValue(expectedError);
        
          const result = await update(params, data);
        
          expect(result).toBe(false);
        });
        
})
