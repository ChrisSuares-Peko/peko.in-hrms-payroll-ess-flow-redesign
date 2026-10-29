const { findById } = require('../../signUpActivityLog');
const signUpActivityLog = require('../../../entities/signUpActivityLog');

jest.mock('../../../entities/signUpActivityLog');

describe('findById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find a pending sign-up activity log by id', async () => {
        const mockResult = { id: 1, status: 'PENDING', companyName: 'Test Corp' };
        signUpActivityLog.findOne.mockResolvedValue(mockResult);

        const result = await findById(1);
        expect(signUpActivityLog.findOne).toHaveBeenCalledWith({
            where: { id: 1, status: 'PENDING' },
        });
        expect(result).toEqual(mockResult);
    });

    it('should return null if not found', async () => {
        signUpActivityLog.findOne.mockResolvedValue(null);

        const result = await findById(999);
        expect(result).toBeNull();
    });
});
