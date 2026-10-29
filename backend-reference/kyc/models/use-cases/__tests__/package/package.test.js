const packageUseCase = require('../../package');
const packageModel = require('../../../entities/package');
const cashback = require('../../../entities/cashback');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('createPackage', () => {
    it('should create a package', async () => {
        const mockResult = { id: 1, packageName: 'Premium' };
        packageModel.create.mockResolvedValue(mockResult);

        const result = await packageUseCase.createPackage({ packageName: 'Premium' });
        expect(result).toEqual(mockResult);
    });

    it('should return undefined on error', async () => {
        packageModel.create.mockRejectedValue(new Error('DB Error'));

        const result = await packageUseCase.createPackage({});
        expect(result).toBeUndefined();
    });
});

describe('findOnePackage', () => {
    it('should find one package by id', async () => {
        const mockResult = { id: 1, packageName: 'Basic' };
        packageModel.findOne.mockResolvedValue(mockResult);

        const result = await packageUseCase.findOnePackage({ id: 1 });
        expect(result).toEqual(mockResult);
        expect(packageModel.findOne).toHaveBeenCalledWith({
            where: { id: 1 },
            raw: true
        });
    });
});

describe('findPackageCashback', () => {
    it('should find cashbacks for a package', async () => {
        const mockResult = [{ id: 1, packageId: 1, cashback: 10 }];
        cashback.findAll.mockResolvedValue(mockResult);

        const result = await packageUseCase.findPackageCashback(1);
        expect(result).toEqual(mockResult);
        expect(cashback.findAll).toHaveBeenCalledWith({
            where: { packageId: 1 },
            raw: true
        });
    });
});

describe('findAllPackage', () => {
    it('should find all packages', async () => {
        const mockResult = [{ id: 1 }, { id: 2 }];
        packageModel.findAll.mockResolvedValue(mockResult);

        const result = await packageUseCase.findAllPackage();
        expect(result).toEqual(mockResult);
    });
});

describe('deletePackage', () => {
    it('should delete a package by id', async () => {
        packageModel.destroy.mockResolvedValue(1);

        const result = await packageUseCase.deletePackage({ id: 1 });
        expect(result).toBe(1);
    });
});

describe('findAllPackagesCount', () => {
    it('should find packages with pagination and search', async () => {
        const mockData = { count: 1, rows: [{ id: 1 }] };
        packageModel.findAndCountAll.mockResolvedValue(mockData);

        const result = await packageUseCase.findAllPackagesCount({
            start: 0, length: 10, searchText: '', order: 'ASC', column: 0
        });
        expect(result).toEqual(mockData);
    });

    it('should default to createdAt column for invalid column index', async () => {
        const mockData = { count: 0, rows: [] };
        packageModel.findAndCountAll.mockResolvedValue(mockData);

        await packageUseCase.findAllPackagesCount({
            start: 0, length: 10, searchText: '', order: 'ASC', column: 99
        });
        expect(packageModel.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                order: [['createdAt', 'ASC']]
            })
        );
    });
});

describe('getExcelCSVData', () => {
    it('should format package data for CSV export', async () => {
        packageModel.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{
                id: 1,
                packageName: 'Basic',
                packagePrice: '99.99',
                description: 'Basic package',
                status: 'Active'
            }]
        });

        const result = await packageUseCase.getExcelCSVData();
        expect(result).toEqual([{
            'ID': 1,
            'Package Name': 'Basic',
            'Package Price': '99.99INR',
            'Package Description': 'Basic package',
            'Status': 'Active'
        }]);
    });

    it('should handle missing values with Not Available', async () => {
        packageModel.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{ id: 1, packageName: null, packagePrice: null, description: null, status: null }]
        });

        const result = await packageUseCase.getExcelCSVData();
        expect(result[0]['Package Name']).toBe('Not Available');
        expect(result[0]['Package Price']).toBe('Not Available');
    });
});
