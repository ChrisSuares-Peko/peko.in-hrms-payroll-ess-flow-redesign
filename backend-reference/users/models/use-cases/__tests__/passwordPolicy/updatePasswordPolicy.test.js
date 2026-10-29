const { updatePasswordPolicy } = require('../../../use-cases/passwordPolicy'); // Adjust path as needed
const passwordPolicy = require('../../../entities/passwordPolicy'); // Adjust path as needed

jest.mock('../../../entities/passwordPolicy', () => ({
    update: jest.fn(),
}));

describe('updatePasswordPolicy', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the password policy successfully', async () => {
        const mockPolicyId = 1;
        const mockUpdateData = {
            minLength: 14,
            minPasswordAge: 60,
        };
        const mockUpdateResult = [1]; // Simulate successful update (1 row affected)

        passwordPolicy.update.mockResolvedValue(mockUpdateResult);

        const result = await updatePasswordPolicy(mockPolicyId, mockUpdateData);

        expect(passwordPolicy.update).toHaveBeenCalledWith(mockUpdateData, {
            where: { id: mockPolicyId },
        });
        expect(result).toEqual(mockUpdateResult);
    });

    it('should handle cases where no policy is found to update', async () => {
        const mockPolicyId = 1;
        const mockUpdateData = {
            minLength: 14,
            minPasswordAge: 60,
        };
        const mockUpdateResult = [0]; // Simulate no rows affected (no policy found)

        passwordPolicy.update.mockResolvedValue(mockUpdateResult);

        const result = await updatePasswordPolicy(mockPolicyId, mockUpdateData);

        expect(passwordPolicy.update).toHaveBeenCalledWith(mockUpdateData, {
            where: { id: mockPolicyId },
        });
        expect(result).toEqual(mockUpdateResult); // Should return [0] to indicate no update
    });


    it('should handle errors during update', async () => {
        const mockPolicyId = 1;
        const mockUpdateData = { /* ... */ };
        const mockError = new Error('Database error');

        passwordPolicy.update.mockRejectedValue(mockError);

        await expect(updatePasswordPolicy(mockPolicyId, mockUpdateData)).rejects.toThrow('Database error'); // Or handle the error as you see fit.

        expect(passwordPolicy.update).toHaveBeenCalledWith(mockUpdateData, {
            where: { id: mockPolicyId },
        });

    });

    it('should handle empty update data', async () => {
        const mockPolicyId = 1;
        const mockUpdateData = {}; // Empty update data.  This may or may not be allowed in your app.
        const mockUpdateResult = [1]; // Simulate successful update (1 row affected)

        passwordPolicy.update.mockResolvedValue(mockUpdateResult);

        const result = await updatePasswordPolicy(mockPolicyId, mockUpdateData);

        expect(passwordPolicy.update).toHaveBeenCalledWith(mockUpdateData, {
            where: { id: mockPolicyId },
        });
        expect(result).toEqual(mockUpdateResult);
    });

});