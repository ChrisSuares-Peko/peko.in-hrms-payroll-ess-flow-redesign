const { update } = require('../../signUpActivityLog');
const signUpActivityLog = require('../../../entities/signUpActivityLog');

jest.mock('../../../entities/signUpActivityLog');

describe('update', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update a sign-up activity log', async () => {
        const mockParams = { id: 1 };
        const mockData = { status: 'APPROVED' };
        signUpActivityLog.update.mockResolvedValue([1]);

        const result = await update(mockParams, mockData);
        expect(signUpActivityLog.update).toHaveBeenCalledWith(mockData, { where: { id: 1 } });
        expect(result).toEqual([1]);
    });

    it('should throw error on failure', async () => {
        const mockError = new Error('DB error');
        signUpActivityLog.update.mockRejectedValue(mockError);

        await expect(update({ id: 1 }, { status: 'APPROVED' })).rejects.toThrow('DB error');
    });
});
