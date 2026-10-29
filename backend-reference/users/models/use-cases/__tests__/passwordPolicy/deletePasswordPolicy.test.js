const { deletePasswordPolicy } = require('../../../use-cases/passwordPolicy'); // Adjust path as needed
const passwordPolicy = require('../../../entities/passwordPolicy'); // Adjust path as needed

jest.mock('../../../entities/passwordPolicy', () => ({
    destroy: jest.fn(),
}));

describe('deletePasswordPolicy', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete the password policy successfully', async () => {
        const mockPolicyId = 1;
        const mockDeleteResult = 1; // Simulate successful deletion (1 row affected)

        passwordPolicy.destroy.mockResolvedValue(mockDeleteResult);

        const result = await deletePasswordPolicy(mockPolicyId);

        expect(passwordPolicy.destroy).toHaveBeenCalledWith({
            where: { id: mockPolicyId },
        });
        expect(result).toEqual(mockDeleteResult);
    });

    it('should handle cases where no policy is found to delete', async () => {
        const mockPolicyId = 1;
        const mockDeleteResult = 0; // Simulate no rows affected (no policy found)

        passwordPolicy.destroy.mockResolvedValue(mockDeleteResult);

        const result = await deletePasswordPolicy(mockPolicyId);

        expect(passwordPolicy.destroy).toHaveBeenCalledWith({
            where: { id: mockPolicyId },
        });
        expect(result).toEqual(mockDeleteResult); // Should return 0 to indicate no deletion
    });

    it('should handle errors during deletion', async () => {
        const mockPolicyId = 1;
        const mockError = new Error('Database error');

        passwordPolicy.destroy.mockRejectedValue(mockError);

        await expect(deletePasswordPolicy(mockPolicyId)).rejects.toThrow('Database error'); // Or handle the error as you see fit.

        expect(passwordPolicy.destroy).toHaveBeenCalledWith({
            where: { id: mockPolicyId },
        });
    });
});