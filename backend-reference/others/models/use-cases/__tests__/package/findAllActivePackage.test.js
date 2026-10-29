const { findAllActivePackage } = require('../../package')
const pkgModel = require('../../../entities/package')
const {Op} = require('sequelize')

describe('find all active packages', () => {
     beforeEach(() => {
          jest.clearAllMocks()
     })

     it('should return a list of active packages without a partnerId', async () => {
          const mockPackages = [
              { id: 1, packageName: 'Premium', status: true },
              { id: 2, packageName: 'Standard', status: true }
          ];
  
          pkgModel.findAll.mockResolvedValue(mockPackages);
  
          const result = await findAllActivePackage(undefined, undefined, false);
  
          expect(pkgModel.findAll).toHaveBeenCalledWith(expect.objectContaining({
              where: { status: true },
              order: [['packageName', 'ASC']],
              raw: true,
              attributes: undefined
          }));
  
          expect(result).toEqual(mockPackages);
      });
  
      it('should return active packages for a specific partnerId', async () => {
          const partnerId = 2;
          const mockPackages = [
              { id: 3, packageName: 'Gold', status: true, partnerId }
          ];
  
          pkgModel.findAll.mockResolvedValue(mockPackages);
  
          const result = await findAllActivePackage(undefined, partnerId, false);
  
          expect(pkgModel.findAll).toHaveBeenCalledWith(expect.objectContaining({
              where: { status: true, partnerId },
              order: [['packageName', 'ASC']],
              raw: true,
              attributes: undefined
          }));
  
          expect(result).toEqual(mockPackages);
      });
  
      it('should exclude Basic package when excludeBasic is true', async () => {
          const mockPackages = [
              { id: 4, packageName: 'Premium', status: true }
          ];
  
          pkgModel.findAll.mockResolvedValue(mockPackages);
  
          const result = await findAllActivePackage(undefined, undefined, true);
  
          expect(pkgModel.findAll).toHaveBeenCalledWith(expect.objectContaining({
              where: {
                  status: true,
                  packageName: { [Op.ne]: 'Basic' }
              },
              order: [['packageName', 'ASC']],
              raw: true,
              attributes: undefined
          }));
  
          expect(result).toEqual(mockPackages);
      });
  
      it('should return active packages with specific attributes', async () => {
          const attributes = ['id', 'packageName'];
          const mockPackages = [{ id: 5, packageName: 'Gold' }];
  
          pkgModel.findAll.mockResolvedValue(mockPackages);
  
          const result = await findAllActivePackage(attributes, undefined, false);
  
          expect(pkgModel.findAll).toHaveBeenCalledWith(expect.objectContaining({
              attributes
          }));
  
          expect(result).toEqual(mockPackages);
      });
  
  });
