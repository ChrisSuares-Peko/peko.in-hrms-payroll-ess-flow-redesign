jest.mock('../../../../utils/commonUploadFile', () => ({
    uploadFile: jest.fn().mockResolvedValue('https://example.com/uploaded-file.png')
}));

const plansUseCase = require('../../plans');
const plans = require('../../../entities/plans');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('create', () => {
    it('should create a plan without logo upload', async () => {
        const mockResult = { id: 1, name: 'Plan A' };
        plans.create.mockResolvedValue(mockResult);

        const result = await plansUseCase.create({ name: 'Plan A', price: 100 });
        expect(result).toEqual(mockResult);
    });

    it('should upload logo and create plan when logo is provided', async () => {
        const mockResult = { id: 1, name: 'Plan A', logo: 'https://example.com/uploaded-file.png' };
        plans.create.mockResolvedValue(mockResult);

        const result = await plansUseCase.create({
            name: 'Plan A',
            logo: 'base64data',
            logoFormat: 'png'
        });
        expect(result).toEqual(mockResult);
    });

    it('should return false when plan creation fails', async () => {
        plans.create.mockResolvedValue(null);

        const result = await plansUseCase.create({ name: 'Plan A' });
        expect(result).toBe(false);
    });
});

describe('findOne', () => {
    it('should find one plan by id', async () => {
        const mockResult = { id: 1, name: 'Plan A' };
        plans.findOne.mockResolvedValue(mockResult);

        const result = await plansUseCase.findOne({ id: 1 });
        expect(result).toEqual(mockResult);
    });
});

describe('findAllPlans', () => {
    it('should find all active plans', async () => {
        const mockResult = [{ id: 1, status: true }];
        plans.findAll.mockResolvedValue(mockResult);

        const result = await plansUseCase.findAllPlans();
        expect(result).toEqual(mockResult);
        expect(plans.findAll).toHaveBeenCalledWith({ where: { status: true } });
    });
});

describe('updatePlan', () => {
    it('should update a plan', async () => {
        plans.update.mockResolvedValue([1]);

        const result = await plansUseCase.updatePlan({ id: 1 }, { name: 'Updated Plan' });
        expect(result).toEqual([1]);
    });

    it('should upload logo when logo data is provided', async () => {
        plans.update.mockResolvedValue([1]);

        await plansUseCase.updatePlan({ id: 1 }, {
            logo: 'base64data',
            logoFormat: 'png'
        });
        expect(plans.update).toHaveBeenCalled();
    });
});

describe('deletePlan', () => {
    it('should delete a plan', async () => {
        plans.destroy.mockResolvedValue(1);

        const result = await plansUseCase.deletePlan({ id: 1 });
        expect(result).toBe(1);
    });
});

describe('findAllPlansAndCount', () => {
    it('should find plans with pagination and search', async () => {
        const mockData = { count: 1, rows: [{ id: 1 }] };
        plans.findAndCountAll.mockResolvedValue(mockData);

        const result = await plansUseCase.findAllPlansAndCount({
            start: 0, length: 10, searchText: '', order: 'ASC', column: 0
        });
        expect(result).toEqual(mockData);
    });
});

describe('fetchPlans', () => {
    it('should fetch plans matching query', async () => {
        const mockResult = [{ id: 1, name: 'Gold' }];
        plans.findAll.mockResolvedValue(mockResult);

        const result = await plansUseCase.fetchPlans('Gold');
        expect(result).toEqual(mockResult);
    });
});

describe('getExcelCSVData', () => {
    it('should format plan data for CSV export', async () => {
        plans.findAll.mockResolvedValue([{
            id: 1, name: 'Basic', price: 99, description: 'Desc', highlights: 'Feature1'
        }]);

        const result = await plansUseCase.getExcelCSVData();
        expect(result).toEqual([{
            'ID': 1,
            'Name': 'Basic',
            'Price': 99,
            'Description': 'Desc',
            'Highlights': 'Feature1'
        }]);
    });

    it('should handle missing values with Not Available', async () => {
        plans.findAll.mockResolvedValue([{
            id: 1, name: null, price: null, description: null, highlights: null
        }]);

        const result = await plansUseCase.getExcelCSVData();
        expect(result[0]['Name']).toBe('Not Available');
        expect(result[0]['Price']).toBe('Not Available');
    });
});
