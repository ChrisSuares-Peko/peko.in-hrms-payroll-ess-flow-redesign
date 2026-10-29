const { updateSignUpActivity } = require('../../../use-cases/signUpActivityLog'); // Adjust path
const signUpActivityLog = require('../../../entities/signUpActivityLog'); 

jest.mock('../../../entities/signUpActivityLog', () => ({
    findOne: jest.fn(),
}));


describe('updateSignUpActivity', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the latest sign-up activity log when found', async () => {
        const mockQuery = { email: 'test@example.com' };
        const mockUpdateData = { activityType: 'SIGN_UP_COMPLETE' };
        const mockLatestRecord = {
            id: 1,
            email: 'test@example.com',
            activityType: 'SIGN_UP_INITIATED',
            update: jest.fn().mockResolvedValue([1]), // Mock the update method
        };

        signUpActivityLog.findOne.mockResolvedValue(mockLatestRecord);

        const result = await updateSignUpActivity(mockQuery, mockUpdateData);

        expect(signUpActivityLog.findOne).toHaveBeenCalledWith({
            where: mockQuery,
            order: [['createdAt', 'DESC']],
        });
        expect(mockLatestRecord.update).toHaveBeenCalledWith(mockUpdateData);
        expect(result).toEqual([1]); // Expect the result of the update operation
    });

    it('should return null if no matching record is found', async () => {
        const mockQuery = { email: 'nonexistent@example.com' };
        const mockUpdateData = { activityType: 'SIGN_UP_COMPLETE' };

        signUpActivityLog.findOne.mockResolvedValue(null);

        const result = await updateSignUpActivity(mockQuery, mockUpdateData);

        expect(signUpActivityLog.findOne).toHaveBeenCalledWith({
            where: mockQuery,
            order: [['createdAt', 'DESC']],
        });
        expect(result).toBeNull();
    });

    it('should handle errors during database operations', async () => {
        const mockQuery = { email: 'test@example.com' };
        const mockUpdateData = { activityType: 'SIGN_UP_COMPLETE' };
        const mockError = new Error('Database error');

        signUpActivityLog.findOne.mockRejectedValue(mockError);

        await expect(updateSignUpActivity(mockQuery, mockUpdateData)).rejects.toThrow(mockError); // or handle the error as you see fit.

        expect(signUpActivityLog.findOne).toHaveBeenCalledWith({
            where: mockQuery,
            order: [['createdAt', 'DESC']],
        });
    });

    it('should handle errors during the update operation', async () => {
      const mockQuery = { email: 'test@example.com' };
      const mockUpdateData = { activityType: 'SIGN_UP_COMPLETE' };
      const mockLatestRecord = {
          id: 1,
          email: 'test@example.com',
          activityType: 'SIGN_UP_INITIATED',
          update: jest.fn().mockRejectedValue(new Error('Update Error')), // Mock a rejection
      };

      signUpActivityLog.findOne.mockResolvedValue(mockLatestRecord);

      await expect(updateSignUpActivity(mockQuery, mockUpdateData)).rejects.toThrow('Update Error');

      expect(signUpActivityLog.findOne).toHaveBeenCalledWith({
          where: mockQuery,
          order: [['createdAt', 'DESC']],
      });
      expect(mockLatestRecord.update).toHaveBeenCalledWith(mockUpdateData);
  });
});