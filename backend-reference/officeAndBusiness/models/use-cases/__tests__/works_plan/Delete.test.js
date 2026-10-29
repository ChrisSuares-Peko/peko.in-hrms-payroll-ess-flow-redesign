const { Delete } = require('../../../use-cases/works_plan');
const work_plans = require('../../../entities/works_plan');

jest.mock('../../../entities/works_plan', () => ({
    destroy: jest.fn(),
}));

describe('Delete', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a work plan successfully and return the number of affected rows', async () => {
        const mockParams = { id: 1 };
        const mockResponse = 1; // Sequelize destroy returns the number of affected rows

        work_plans.destroy.mockResolvedValue(mockResponse);

        const result = await Delete(mockParams);

        expect(work_plans.destroy).toHaveBeenCalledWith({ where: { id: mockParams.id } });
        expect(result).toEqual(mockResponse);
    });

    it('should return 0 when no work plan is deleted', async () => {
        const mockParams = { id: 2 };
        work_plans.destroy.mockResolvedValue(0);

        const result = await Delete(mockParams);

        expect(result).toBe(0);
    });

    it('should return 0 when trying to delete a work plan that does not exist', async () => {
        const mockParams = { id: 999 }; // Assuming 999 doesn't exist in the database
        work_plans.destroy.mockResolvedValue(0); // No rows affected if the work plan doesn't exist
    
        const result = await Delete(mockParams);
    
        expect(result).toBe(0); // Expect 0 since no record is found for deletion
    });
    
    
});
