const vendorUseCase = require('../../vendors');
const vendor = require('../../../entities/vendor');
const sequelizeConfig = require('../../../../configs/database/index');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('create', () => {
    it('should create a vendor in a transaction', async () => {
        const mockTransaction = {
            commit: jest.fn(),
            rollback: jest.fn()
        };
        sequelizeConfig.transaction.mockResolvedValue(mockTransaction);
        const mockResult = { id: 1, vendorName: 'Vendor1' };
        vendor.create.mockResolvedValue(mockResult);

        const result = await vendorUseCase.create({ vendorName: 'Vendor1' });
        expect(result).toEqual(mockResult);
        expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should rollback on error and return false', async () => {
        const mockTransaction = {
            commit: jest.fn(),
            rollback: jest.fn()
        };
        sequelizeConfig.transaction.mockResolvedValue(mockTransaction);
        vendor.create.mockRejectedValue(new Error('DB Error'));

        const result = await vendorUseCase.create({ vendorName: 'Vendor1' });
        expect(result).toBe(false);
        expect(mockTransaction.rollback).toHaveBeenCalled();
    });
});

describe('findOne', () => {
    it('should find a vendor by vendorCode', async () => {
        const mockResult = { id: 1, vendorCode: 'V001' };
        vendor.findOne.mockResolvedValue(mockResult);

        const result = await vendorUseCase.findOne({ vendorCode: 'V001' });
        expect(result).toEqual(mockResult);
    });
});

describe('find', () => {
    it('should find a vendor by vendorName', async () => {
        const mockResult = { id: 1, vendorName: 'TestVendor' };
        vendor.findOne.mockResolvedValue(mockResult);

        const result = await vendorUseCase.find('TestVendor');
        expect(result).toEqual(mockResult);
    });
});

describe('update', () => {
    it('should update a vendor', async () => {
        vendor.update.mockResolvedValue([1]);

        const result = await vendorUseCase.update({ id: 1 }, { vendorName: 'Updated' });
        expect(result).toEqual([1]);
    });
});

describe('Delete', () => {
    it('should delete a vendor by vendorCode', async () => {
        vendor.destroy.mockResolvedValue(1);

        const result = await vendorUseCase.Delete({ vendorCode: 'V001' });
        expect(result).toBe(1);
    });
});

describe('findAllVendors', () => {
    it('should find all vendors with pagination', async () => {
        const mockData = { count: 1, rows: [{ id: 1 }] };
        vendor.findAndCountAll.mockResolvedValue(mockData);

        const result = await vendorUseCase.findAllVendors({
            start: 0, length: 10, searchText: '', order: 'ASC', column: 0
        });
        expect(result).toEqual(mockData);
    });
});

describe('fetchVendorDetails', () => {
    it('should fetch vendors matching query', async () => {
        const mockResult = [{ id: 1, vendorName: 'Test' }];
        vendor.findAll.mockResolvedValue(mockResult);

        const result = await vendorUseCase.fetchVendorDetails('Test');
        expect(result).toEqual(mockResult);
    });
});

describe('fetchVendorData', () => {
    it('should fetch vendors by type', async () => {
        const mockResult = [{ id: 1, vendorName: 'V1' }];
        vendor.findAll.mockResolvedValue(mockResult);

        const result = await vendorUseCase.fetchVendorData('payment');
        expect(result).toEqual(mockResult);
    });
});

describe('updateStatus', () => {
    it('should update vendor status', async () => {
        vendor.update.mockResolvedValue([1]);

        const mockReq = { params: { id: 1 }, body: { isActive: true } };
        const result = await vendorUseCase.updateStatus(mockReq, {}, jest.fn());
        expect(result).toEqual([1]);
    });
});

describe('getExcelCSVData', () => {
    it('should format vendor data for CSV', async () => {
        vendor.findAll.mockResolvedValue([{
            Id: 1,
            vendorName: 'Vendor1',
            isActive: true,
            apiUrl: 'https://api.test.com',
            healthUrl: 'https://health.test.com'
        }]);

        const result = await vendorUseCase.getExcelCSVData();
        expect(result[0]['Vendor Code']).toBe(1);
        expect(result[0]['Vendor Name']).toBe('Vendor1');
        expect(result[0]['Vendor Status']).toBe('Active');
        expect(result[0]['Api Url']).toBe('HTTPS://API.TEST.COM');
    });

    it('should handle null/missing vendor data', async () => {
        vendor.findAll.mockResolvedValue([{
            Id: 1, vendorName: null, isActive: null, apiUrl: null, healthUrl: null
        }]);

        const result = await vendorUseCase.getExcelCSVData();
        expect(result[0]['Vendor Name']).toBe('Not Available');
        expect(result[0]['Vendor Status']).toBe('Not Available');
    });
});
