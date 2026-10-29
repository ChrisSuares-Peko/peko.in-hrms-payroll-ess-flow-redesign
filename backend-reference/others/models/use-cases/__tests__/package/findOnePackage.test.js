const { findOnePackage } = require('../../package')
const pkgModel = require('../../../entities/package')

describe('fine One package', () => {
     beforeEach(() => {
          jest.clearAllMocks()
     })

     it('should return a package with a valid ID', async () => {
          const params = { id: 1 }
          const mockResult = {
               id: 1,
               name: 'Package 1',
               price: '100',
          }

          pkgModel.findOne.mockResolvedValue(mockResult)

          const result = await findOnePackage(params)

          expect(pkgModel.findOne).toHaveBeenCalledWith({
               where: { id: 1 },
               raw: true,
          })
          expect(result).toEqual(mockResult)
     })

     it('should return null if no package is found for the given ID', async () => {
          const params = { id: 999 }
          const mockResult = null

          pkgModel.findOne.mockResolvedValue(mockResult)

          const result = await findOnePackage(params)

          expect(pkgModel.findOne).toHaveBeenCalledWith({
               where: { id: 999 },
               raw: true,
          })
          expect(result).toBeNull()
     })

     it('should handle cases where the ID is missing from params', async () => {
          const params = {}
          const mockResult = null

          pkgModel.findOne.mockResolvedValue(mockResult)

          const result = await findOnePackage(params)

          expect(pkgModel.findOne).toHaveBeenCalledWith({
               where: { id: undefined },
               raw: true,
          })
          expect(result).toBeNull()
     })
     it('should handle errors thrown during the database call', async () => {
          const params = { id: 1 };
          const mockError = new Error('Database error');
          pkgModel.findOne.mockRejectedValue(mockError);
  
          // Mock console.log to track its calls
          console.log = jest.fn();
  
          await findOnePackage(params);
  
          // Ensure that console.log was called with the expected error message
          expect(console.log).toHaveBeenCalledWith(mockError);
  
          // Check if the function still logs the route call
          expect(console.log).toHaveBeenCalledWith("PACKAGE FIND ONE ROUTE CALLED");
      });
  
      it('should log the function call even when no errors occur', async () => {
          const params = { id: 1 };
          const mockResult = {
              id: 1,
              name: 'Package 1',
              price: '100',
          };
  
          pkgModel.findOne.mockResolvedValue(mockResult);
  
          // Mock console.log to track its calls
          console.log = jest.fn();
  
          await findOnePackage(params);
  
          // Check that the route call is logged
          expect(console.log).toHaveBeenCalledWith("PACKAGE FIND ONE ROUTE CALLED");
  
          // Ensure the correct results are returned
          expect(console.log).not.toHaveBeenCalledWith(expect.any(Error));
      });
  
      it('should handle invalid ID types gracefully (e.g., string, boolean)', async () => {
          const params = { id: "invalid" }; // Passing a string instead of a valid ID
          const mockResult = null;
  
          pkgModel.findOne.mockResolvedValue(mockResult);
  
          const result = await findOnePackage(params);
  
          expect(pkgModel.findOne).toHaveBeenCalledWith({
              where: { id: "invalid" },
              raw: true,
          });
          expect(result).toBeNull();
      });
  
      it('should handle unexpected fields in params gracefully', async () => {
          const params = { id: 1, unexpectedField: 'value' }; // Extra unexpected field
          const mockResult = {
              id: 1,
              name: 'Package 1',
              price: '100',
          };
  
          pkgModel.findOne.mockResolvedValue(mockResult);
  
          const result = await findOnePackage(params);
  
          expect(pkgModel.findOne).toHaveBeenCalledWith({
              where: { id: 1, unexpectedField: 'value' },
              raw: true,
          });
          expect(result).toEqual(mockResult);
      });

})
