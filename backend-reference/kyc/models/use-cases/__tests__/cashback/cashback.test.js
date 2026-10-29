const cashbackUseCase = require('../../cashback');
const cashback = require('../../../entities/cashback');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('create', () => {
    it('should create a cashback entry', async () => {
        const mockResult = { id: 1, cashback: 10 };
        cashback.create.mockResolvedValue(mockResult);

        const result = await cashbackUseCase.create({ cashback: 10, packageId: 1, serviceOperatorId: 1 });
        expect(result).toEqual(mockResult);
    });
});

describe('update', () => {
    it('should update a cashback entry', async () => {
        cashback.update.mockResolvedValue([1]);

        const result = await cashbackUseCase.update({ id: 1 }, { cashback: 20 });
        expect(result).toEqual([1]);
        expect(cashback.update).toHaveBeenCalledWith({ cashback: 20 }, { where: { id: 1 } });
    });
});

describe('findOne', () => {
    it('should find one cashback by serviceOperatorId and packageId', async () => {
        const mockResult = { id: 1, packageId: 1, serviceOperatorId: 1, cashback: 10 };
        cashback.findOne.mockResolvedValue(mockResult);

        const result = await cashbackUseCase.findOne({ serviceOperatorId: 1, packageId: 1 });
        expect(result).toEqual(mockResult);
        expect(cashback.findOne).toHaveBeenCalledWith({
            where: { packageId: 1, serviceOperatorId: 1, serviceStatus: true },
            raw: true
        });
    });

    it('should return undefined on error', async () => {
        cashback.findOne.mockRejectedValue(new Error('DB Error'));

        const result = await cashbackUseCase.findOne({ serviceOperatorId: 1, packageId: 1 });
        expect(result).toBeUndefined();
    });
});

describe('deleteCashback', () => {
    it('should delete a cashback entry', async () => {
        cashback.destroy.mockResolvedValue(1);

        const result = await cashbackUseCase.deleteCashback({ id: 1 });
        expect(result).toBe(1);
    });
});

describe('findAllPackageCashbackCount', () => {
    it('should find all cashbacks with pagination and search', async () => {
        const mockData = { count: 1, rows: [{ id: 1, cashback: 10 }] };
        cashback.findAndCountAll.mockResolvedValue(mockData);

        const result = await cashbackUseCase.findAllPackageCashbackCount({
            start: 0, length: 10, searchText: '', order: 'ASC', column: 0
        });
        expect(result).toEqual(mockData);
    });
});

describe('getExcelCSVData', () => {
    it('should format cashback data for CSV export', async () => {
        cashback.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{
                serviceOperator: { serviceProvider: 'TestOP' },
                package: { packageName: 'Basic' },
                cashbackType: 'PERCENTAGE',
                serviceStatus: true,
                cashback: '5',
                surcharge: '2'
            }]
        });

        const result = await cashbackUseCase.getExcelCSVData();
        expect(result).toEqual([{
            'Service Operator': 'TestOP',
            'Commission Type': 'PERCENTAGE',
            'Package Name': 'Basic',
            'Status': 'Active',
            'Cashback': '5',
            'Surcharge': '2'
        }]);
    });
});
