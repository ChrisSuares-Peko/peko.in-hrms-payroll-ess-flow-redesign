const serviceOperatorUseCase = require('../../serviceOperator');
const serviceOperator = require('../../../entities/serviceOperator');
const sequelizeConfig = require('../../../../configs/database/index');

beforeEach(() => {
    jest.clearAllMocks();
    // Ensure query and QueryTypes are available on sequelizeConfig
    if (!sequelizeConfig.query || !sequelizeConfig.query.mockResolvedValue) {
        sequelizeConfig.query = jest.fn();
    }
    if (!sequelizeConfig.QueryTypes) {
        sequelizeConfig.QueryTypes = { SELECT: 'SELECT' };
    }
});

describe('create', () => {
    it('should create a service operator', async () => {
        const mockResult = { id: 1, serviceProvider: 'TestOp' };
        serviceOperator.create.mockResolvedValue(mockResult);

        const result = await serviceOperatorUseCase.create({ serviceProvider: 'TestOp' });
        expect(result).toEqual(mockResult);
    });
});

describe('findOne', () => {
    it('should find one service operator by accessKey', async () => {
        const mockResult = { id: 1, accessKey: 'KEY1', vendor: {} };
        serviceOperator.findOne.mockResolvedValue(mockResult);

        const result = await serviceOperatorUseCase.findOne({ accessKey: 'KEY1' });
        expect(result).toEqual(mockResult);
    });

    it('should include serviceType in where clause when provided', async () => {
        serviceOperator.findOne.mockResolvedValue(null);

        await serviceOperatorUseCase.findOne({ accessKey: 'KEY1', serviceType: '1' });
        expect(serviceOperator.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { accessKey: 'KEY1', serviceType: '1' }
            })
        );
    });
});

describe('findAllServiceOperator', () => {
    it('should find all active service operators', async () => {
        const mockResult = [{ id: 1, serviceStatus: true }];
        serviceOperator.findAll.mockResolvedValue(mockResult);

        const result = await serviceOperatorUseCase.findAllServiceOperator();
        expect(result).toEqual(mockResult);
    });
});

describe('updateServiceOperator', () => {
    it('should update a service operator', async () => {
        serviceOperator.update.mockResolvedValue([1]);

        const result = await serviceOperatorUseCase.updateServiceOperator({ id: 1 }, { serviceProvider: 'Updated' });
        expect(result).toEqual([1]);
    });
});

describe('Delete', () => {
    it('should delete a service operator by serviceId', async () => {
        serviceOperator.destroy.mockResolvedValue(1);

        const result = await serviceOperatorUseCase.Delete({ serviceId: 'S1' });
        expect(result).toBe(1);
        expect(serviceOperator.destroy).toHaveBeenCalledWith({
            where: { serviceId: 'S1' }
        });
    });
});

describe('find', () => {
    it('should find by serviceProvider or accessKey', async () => {
        const mockResult = { id: 1 };
        serviceOperator.findOne.mockResolvedValue(mockResult);

        const result = await serviceOperatorUseCase.find({ serviceProvider: 'Test', accessKey: 'KEY1' });
        expect(result).toEqual(mockResult);
    });
});

describe('fetchServiceOperator', () => {
    it('should fetch service operators matching query', async () => {
        const mockResult = [{ id: 1, serviceProvider: 'TestOp' }];
        serviceOperator.findAll.mockResolvedValue(mockResult);

        const result = await serviceOperatorUseCase.fetchServiceOperator('Test');
        expect(result).toEqual(mockResult);
    });
});

describe('findAllServiceOperatorCount', () => {
    it('should find all service operators with pagination', async () => {
        const mockData = { count: 1, rows: [{ id: 1 }] };
        serviceOperator.findAndCountAll.mockResolvedValue(mockData);

        const result = await serviceOperatorUseCase.findAllServiceOperatorCount({
            start: 0, length: 10, draw: 1, searchText: '', order: 'ASC', column: 0
        });
        expect(result).toEqual(mockData);
    });
});

describe('getExcelCSVData', () => {
    it('should format service operator data for CSV', async () => {
        serviceOperator.findAll.mockResolvedValue([{
            id: 1,
            serviceProvider: 'TestOp',
            accessKey: 'KEY1',
            serviceStatus: true,
            providerCommission: '5',
            serviceImage: 'img.png',
            serviceCategory: 'Payments',
            vendor: { vendorName: 'Vendor1' },
            countryName: 'India',
            countryCode: 'IN',
            balanceMethod: true,
            commissionType: 'PERCENTAGE',
            serviceType: '1'
        }]);

        const result = await serviceOperatorUseCase.getExcelCSVData();
        expect(result[0]['Service Provider Name']).toBe('TestOp');
        expect(result[0]['Vendor Name']).toBe('Vendor1');
        expect(result[0]['Service Type']).toBe('Bill Payment');
    });
});

describe('findLastFiveTransactions', () => {
    it('should execute raw query for last five transactions', async () => {
        const mockResults = [{ id: 1, totalCount: 10 }];
        sequelizeConfig.query.mockResolvedValue(mockResults);

        const result = await serviceOperatorUseCase.findLastFiveTransactions({
            userId: 1, length: 5, serviceProvider: 'TestOp',
            status: ['SUCCESS'], orderCol: 'createdAt', order: 'DESC'
        });
        expect(result).toEqual(mockResults);
        expect(sequelizeConfig.query).toHaveBeenCalled();
    });
});
