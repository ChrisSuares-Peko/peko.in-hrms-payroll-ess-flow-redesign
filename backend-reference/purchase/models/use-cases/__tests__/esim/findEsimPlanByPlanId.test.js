const { findEsimPlanByPlanId } = require('../../../use-cases/esim');
const esim = require('../../../entities/esim');

jest.mock('../../../entities/esim', () => ({
    findOne: jest.fn(),
}));

describe('findEsimPlanByPlanId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an eSIM plan if found by planId', async () => {
        const mockPlanId = 'PLAN123';
        const mockEsim = {
            id: 1,
            planId: mockPlanId,
            name: 'Premium Plan',
            price: 50,
            validity: '90 days',
        };

        esim.findOne.mockResolvedValue(mockEsim);

        const result = await findEsimPlanByPlanId(mockPlanId);

        expect(esim.findOne).toHaveBeenCalledWith({
            where: { planId: mockPlanId },
        });
        expect(result).toEqual({
            success: true,
            message: "Esim Plans fetched successfully",
            data: mockEsim,
        });
    });

    it('should return a message if no eSIM plan is found', async () => {
        const mockPlanId = 'INVALIDPLAN';
        esim.findOne.mockResolvedValue(null);

        const result = await findEsimPlanByPlanId(mockPlanId);

        expect(result).toEqual({
            success: false,
            message: "Esim Plans not found",
        });
    });

    it('should return an error message if the database query fails', async () => {
        const mockPlanId = 'PLAN123';
        const mockError = new Error('Database error');

        esim.findOne.mockRejectedValue(mockError);

        const result = await findEsimPlanByPlanId(mockPlanId);

        expect(result).toEqual({
            success: false,
            message: "An error occurred while fetching the Esim PlanId",
        });
    });
});
