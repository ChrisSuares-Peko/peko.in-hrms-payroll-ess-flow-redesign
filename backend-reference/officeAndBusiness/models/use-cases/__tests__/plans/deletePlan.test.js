const { deletePlan } = require('../../../use-cases/plans');
const plans = require('../../../entities/plans');

jest.mock('../../../entities/plans', () => ({
    destroy: jest.fn(),
}));

describe('deletePlan', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a plan and return the number of affected rows', async () => {
        const mockParams = { id: 1 };
        const mockResponse = 1; // 1 row affected

        plans.destroy.mockResolvedValue(mockResponse);

        const result = await deletePlan(mockParams);

        expect(plans.destroy).toHaveBeenCalledWith({ where: { id: mockParams.id } });
        expect(result).toEqual(mockResponse);
    });

    it('should return 0 when no records are deleted', async () => {
        const mockParams = { id: 2 };
        plans.destroy.mockResolvedValue(0);

        const result = await deletePlan(mockParams);

        expect(result).toEqual(0);
    });

    it('should throw an error when delete fails', async () => {
        const mockParams = { id: 3 };
        const mockError = new Error('Database error');

        plans.destroy.mockRejectedValue(mockError);

        await expect(deletePlan(mockParams)).rejects.toThrow('Database error');
    });
});
