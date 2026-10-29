const disableServiceUseCase = require('../../disableService');
const disableService = require('../../../entities/disabledService');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('create', () => {
    it('should create a disabled service entry', async () => {
        const mockResult = { id: 1, serviceOperatorId: 1, credentialId: 1 };
        disableService.create.mockResolvedValue(mockResult);

        const result = await disableServiceUseCase.create({ serviceOperatorId: 1, credentialId: 1 });
        expect(result).toEqual(mockResult);
    });
});

describe('Delete', () => {
    it('should delete a disabled service entry', async () => {
        disableService.destroy.mockResolvedValue(1);

        const result = await disableServiceUseCase.Delete({ id: 1 });
        expect(result).toBe(1);
        expect(disableService.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
    });
});

describe('findOne', () => {
    it('should find one disabled service by id', async () => {
        const mockResult = { id: 1, serviceOperatorId: 1 };
        disableService.findOne.mockResolvedValue(mockResult);

        const result = await disableServiceUseCase.findOne({ id: 1 });
        expect(result).toEqual(mockResult);
    });
});

describe('find', () => {
    it('should find a disabled service by serviceOperatorId and credentialId', async () => {
        const mockResult = { id: 1 };
        disableService.findOne.mockResolvedValue(mockResult);

        const result = await disableServiceUseCase.find({ serviceOperatorId: 1, credentialId: 1 });
        expect(result).toEqual(mockResult);
        expect(disableService.findOne).toHaveBeenCalledWith({
            where: { credentialId: 1, serviceOperatorId: 1 }
        });
    });
});

describe('findAll', () => {
    it('should find all disabled services with pagination', async () => {
        const mockData = { count: 1, rows: [{ id: 1 }] };
        disableService.findAndCountAll.mockResolvedValue(mockData);

        const result = await disableServiceUseCase.findAll({
            start: 0, length: 10, searchText: '', order: 'ASC', column: 0
        });
        expect(result).toEqual(mockData);
    });
});

describe('getExcel', () => {
    it('should format disabled service data for Excel export', async () => {
        disableService.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{
                Id: 1,
                serviceOperator: { serviceProvider: 'TestOp' },
                credentialId: 5,
                credential: { name: 'Corp1' },
                serviceStatus: true
            }]
        });

        const result = await disableServiceUseCase.getExcel();
        expect(result).toEqual([{
            'ID': 1,
            'Service Operator': 'TestOp',
            'CorporateId': 5,
            'Corporate Name': 'Corp1',
            'Service Status': true
        }]);
    });
});
