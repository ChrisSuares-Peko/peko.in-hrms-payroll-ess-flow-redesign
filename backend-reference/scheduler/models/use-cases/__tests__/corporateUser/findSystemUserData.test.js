const { findSystemUserData } = require('../../corporateUser');
const systemUser = require('../../../entities/systemUser');

jest.mock('@logtail/node', () => ({
    Logtail: jest.fn().mockImplementation(() => ({
        info: jest.fn(),
        error: jest.fn(),
    })),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('findSystemUserData', () => {
    it('should find system user data by credentialId', async () => {
        const mockResult = {
            email: 'admin@test.com',
            dailyReport: { isActive: true },
            weeklyReport: null,
            monthlyReport: null
        };
        systemUser.findOne.mockResolvedValue(mockResult);

        const result = await findSystemUserData(1);
        expect(result).toEqual(mockResult);
        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: 1 },
            attributes: ['email', 'dailyReport', 'weeklyReport', 'monthlyReport']
        });
    });

    it('should return null when system user not found', async () => {
        systemUser.findOne.mockResolvedValue(null);

        const result = await findSystemUserData(999);
        expect(result).toBeNull();
    });
});
