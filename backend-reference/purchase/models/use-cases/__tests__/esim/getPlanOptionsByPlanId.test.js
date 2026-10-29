const { getPlanOptionsByPlanId } = require('../../../use-cases/esim');
const esim = require('../../../entities/esim');

jest.mock('../../../entities/esim', () => ({
    findAll: jest.fn(),
}));

describe('getPlanOptionsByPlanId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return grouped plan options by planId', async () => {
        const mockPlanId = 'PLAN123';
        const mockPlans = [
            { dataMBs: 500, periodDays: 7 },
            { dataMBs: 500, periodDays: 14 },
            { dataMBs: 1000, periodDays: 30 }
        ];

        const expectedOutput = [
            { dataMBs: 500, periodDays: [7, 14] },
            { dataMBs: 1000, periodDays: [30] }
        ];

        esim.findAll.mockResolvedValue(mockPlans);

        const result = await getPlanOptionsByPlanId(mockPlanId);

        expect(esim.findAll).toHaveBeenCalledWith({
            attributes: ['dataMBs', 'periodDays'],
            where: { planId: mockPlanId, status: true },
            raw: true,
        });
        expect(result).toEqual(expectedOutput);
    });

    it('should return an empty array if no plans are found', async () => {
        const mockPlanId = 'INVALIDPLAN';
        esim.findAll.mockResolvedValue([]);

        const result = await getPlanOptionsByPlanId(mockPlanId);

        expect(result).toEqual([]);
    });

    it('should return false if an error occurs during query execution', async () => {
        const mockPlanId = 'PLAN123';
        const mockError = new Error('Database error');

        esim.findAll.mockRejectedValue(mockError);

        const result = await getPlanOptionsByPlanId(mockPlanId);

        expect(result).toBe(false);
    });
});
