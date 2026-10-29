const { findAllActiveServicePackage } = require('../../package'); // Assuming the function is in this path
const pkgModel = require('../../../entities/package');
const { Op } = require('sequelize');

jest.mock('../../../entities/package'); 

describe('findAllActiveServicePackage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all active service packages when no filters are applied', async () => {
        const mockPackages = [{ id: 1, packageName: 'Package 1' }, { id: 2, packageName: 'Package 2' }];
        const attributes = ['id', 'packageName'];
        const partnerId = undefined;
        const excludeBasic = false;

        // Mocking the `findAll` method
        pkgModel.findAll.mockResolvedValue(mockPackages);

        const result = await findAllActiveServicePackage(attributes, partnerId, excludeBasic);

        expect(pkgModel.findAll).toHaveBeenCalledWith({
            where: { type: 1, status: true },
            raw: true,
            attributes,
            order: [['packageName', 'ASC']],
        });
        expect(result).toEqual(mockPackages);
    });

    it('should return packages with the specific partnerId when provided', async () => {
        const mockPackages = [{ id: 1, packageName: 'Package 1' }];
        const attributes = ['id', 'packageName'];
        const partnerId = 1; // Specific partner ID
        const excludeBasic = false;

        // Mocking the `findAll` method
        pkgModel.findAll.mockResolvedValue(mockPackages);

        const result = await findAllActiveServicePackage(attributes, partnerId, excludeBasic);

        expect(pkgModel.findAll).toHaveBeenCalledWith({
            where: { type: 1, status: true, partnerId: 1 },
            raw: true,
            attributes,
            order: [['packageName', 'ASC']],
        });
        expect(result).toEqual(mockPackages);
    });

    it('should return packages with partnerId as null when partnerId is "default"', async () => {
        const mockPackages = [{ id: 1, packageName: 'Package 1' }];
        const attributes = ['id', 'packageName'];
        const partnerId = 'default'; // Special value for partnerId
        const excludeBasic = false;

        // Mocking the `findAll` method
        pkgModel.findAll.mockResolvedValue(mockPackages);

        const result = await findAllActiveServicePackage(attributes, partnerId, excludeBasic);

        expect(pkgModel.findAll).toHaveBeenCalledWith({
            where: { type: 1, status: true, partnerId: null },
            raw: true,
            attributes,
            order: [['packageName', 'ASC']],
        });
        expect(result).toEqual(mockPackages);
    });

    it('should exclude packages with packageName "Basic" when excludeBasic is true', async () => {
        const mockPackages = [{ id: 1, packageName: 'Package 1' }];
        const attributes = ['id', 'packageName'];
        const partnerId = undefined;
        const excludeBasic = true; // Exclude basic packages

        // Mocking the `findAll` method
        pkgModel.findAll.mockResolvedValue(mockPackages);

        const result = await findAllActiveServicePackage(attributes, partnerId, excludeBasic);

        expect(pkgModel.findAll).toHaveBeenCalledWith({
            where: { type: 1, status: true, packageName: { [Op.ne]: 'Basic' } },
            raw: true,
            attributes,
            order: [['packageName', 'ASC']],
        });
        expect(result).toEqual(mockPackages);
    });

    it('should catch and log error if something goes wrong', async () => {
        const mockError = new Error('Database error');
        const attributes = ['id', 'packageName'];
        const partnerId = undefined;
        const excludeBasic = false;

        // Mocking the `findAll` method to throw an error
        pkgModel.findAll.mockRejectedValue(mockError);

        // Mocking console.log to verify the error handling
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const result = await findAllActiveServicePackage(attributes, partnerId, excludeBasic);

        expect(pkgModel.findAll).toHaveBeenCalledWith({
            where: { type: 1, status: true },
            raw: true,
            attributes,
            order: [['packageName', 'ASC']],
        });
        expect(consoleSpy).toHaveBeenCalledWith(mockError);
        expect(result).toBeUndefined(); // Error handling should not return anything
    });

    it('should remove partnerId from where clause if partnerId is not provided', async () => {
        const mockPackages = [{ id: 1, packageName: 'Package 1' }];
        const attributes = ['id', 'packageName'];
        const partnerId = undefined;
        const excludeBasic = false;

        // Mocking the `findAll` method
        pkgModel.findAll.mockResolvedValue(mockPackages);

        const result = await findAllActiveServicePackage(attributes, partnerId, excludeBasic);

        expect(pkgModel.findAll).toHaveBeenCalledWith({
            where: { type: 1, status: true },
            raw: true,
            attributes,
            order: [['packageName', 'ASC']],
        });
        expect(result).toEqual(mockPackages);
    });
});
