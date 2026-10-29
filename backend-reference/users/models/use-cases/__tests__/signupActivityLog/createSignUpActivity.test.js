const { createSignUpActivity } = require('../../../use-cases/signUpActivityLog'); // Adjust path
const signUpActivityLog = require('../../../entities/signUpActivityLog'); 

jest.mock('../../../entities/signUpActivityLog', () => ({
    create: jest.fn(),
}));


describe('createSignUpActivity', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new sign-up activity log', async () => {
        const mockActivityData = {
            userId: 123,
            activityType: 'SIGN_UP_SUCCESS',
            // ... other activity data
        };
        const mockCreatedActivity = { id: 1, ...mockActivityData }; // Add ID as it will be generated

        signUpActivityLog.create.mockResolvedValue(mockCreatedActivity);

        const result = await createSignUpActivity(mockActivityData);

        expect(signUpActivityLog.create).toHaveBeenCalledWith(mockActivityData);
        expect(result).toEqual(mockCreatedActivity);
    });

    it('should handle errors during activity log creation', async () => {
        const mockActivityData = {
          userId: 123,
          activityType: 'SIGN_UP_SUCCESS',
          // ... other activity data
        };
        const mockError = new Error('Database error');

        signUpActivityLog.create.mockRejectedValue(mockError);

        await expect(createSignUpActivity(mockActivityData)).rejects.toThrow(mockError); // Or handle it differently

        expect(signUpActivityLog.create).toHaveBeenCalledWith(mockActivityData);
    });

   
});