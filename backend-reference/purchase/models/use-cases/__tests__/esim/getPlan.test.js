const { getPlan } = require('../../../use-cases/esim');
const esim = require('../../../entities/esim');

jest.mock('../../../entities/esim', () => ({
    findOne: jest.fn(),
}));

describe('getPlan', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an eSIM plan if found', async () => {
        const mockData = { country: 'United States', data: 500, validity: 30 };
        const mockPlan = {
            amount: 10,
            planId: 'PLAN123',
            name: 'Basic Plan',
            dataMBs: 500,
            periodDays: 30,
            country: 'United States'
        };

        esim.findOne.mockResolvedValue(mockPlan);

        const result = await getPlan(mockData);

        expect(esim.findOne).toHaveBeenCalledWith({
            where: {
                country: mockData.country,
                dataMBs: mockData.data,
                periodDays: mockData.validity,
                status: true,
            },
            attributes: ['amount', 'planId', 'name', 'dataMBs', 'periodDays', 'country'],
            raw: true,
        });
        expect(result).toEqual(mockPlan);
    });

    it('should return null if no eSIM plan is found', async () => {
        const mockData = { country: 'Invalid Country', data: 1000, validity: 60 };
        esim.findOne.mockResolvedValue(null);

        const result = await getPlan(mockData);

        expect(result).toBeNull();
    });

    it('should return false if an error occurs during query execution', async () => {
        const mockData = { country: 'United States', data: 500, validity: 30 };
        const mockError = new Error('Database error');

        esim.findOne.mockRejectedValue(mockError);

        const result = await getPlan(mockData);

        expect(result).toBe(false);
    });
});
