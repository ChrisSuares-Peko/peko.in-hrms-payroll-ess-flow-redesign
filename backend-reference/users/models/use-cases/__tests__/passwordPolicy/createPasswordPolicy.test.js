const { createPasswordPolicy } = require('../../../use-cases/passwordPolicy'); // Adjust path as needed
const passwordPolicy = require('../../../entities/passwordPolicy'); // Adjust path as needed

jest.mock('../../../entities/passwordPolicy', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
}));

describe('createPasswordPolicy', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new password policy successfully', async () => {
        const mockPolicyData = {
            level: 'strong',
            minLength: 12,
            minPasswordAge: 30,
            maxPasswordAge: 90,
            minChangeChars: 4,
            prohibitPasswordReuse: true,
            prohibitPasswordReuseTimes: 5,
        };
        const mockCreatedPolicy = { id: 1, ...mockPolicyData }; // Add ID as it will be generated

        passwordPolicy.findOne.mockResolvedValue(null); // No existing policy
        passwordPolicy.create.mockResolvedValue(mockCreatedPolicy);

        const result = await createPasswordPolicy(mockPolicyData);

        expect(passwordPolicy.findOne).toHaveBeenCalled(); // Called to check existing
        expect(passwordPolicy.create).toHaveBeenCalledWith(mockPolicyData);
        expect(result).toEqual({
            status: true,
            message: "Password policy created successfully",
            data: mockCreatedPolicy,
        });
    });

    it('should return an error if policy data is invalid', async () => {
        const result = await createPasswordPolicy(null); // Invalid data

        expect(result).toEqual({
            status: false,
            message: "Invalid policy data",
            data: {},
        });
        expect(passwordPolicy.findOne).not.toHaveBeenCalled(); // Not called if data is invalid
        expect(passwordPolicy.create).not.toHaveBeenCalled();
    });

    it('should return an error if a password policy already exists', async () => {
        const mockPolicyData = { /* ... */ }; // Mock data
        const mockExistingPolicy = { id: 1, /* ... */ }; // Existing policy

        passwordPolicy.findOne.mockResolvedValue(mockExistingPolicy); // Policy exists

        const result = await createPasswordPolicy(mockPolicyData);

        expect(passwordPolicy.findOne).toHaveBeenCalled(); // Called to check existing
        expect(passwordPolicy.create).not.toHaveBeenCalled(); // Not called if policy exists
        expect(result).toEqual({
            status: false,
            message: "Password policy already exists",
            data: {},
        });
    });

    it('should handle errors during policy creation', async () => {
        const mockPolicyData = { /* ... */ };
        const mockError = new Error('Database error');

        passwordPolicy.findOne.mockResolvedValue(null);
        passwordPolicy.create.mockRejectedValue(mockError); // Simulate error

        const result = await createPasswordPolicy(mockPolicyData);

        expect(passwordPolicy.findOne).toHaveBeenCalled();
        expect(passwordPolicy.create).toHaveBeenCalled();
        expect(result).toEqual({
            status: false,
            message: "Database error", // Or mockError.message
            data: {},
        });
    });
});