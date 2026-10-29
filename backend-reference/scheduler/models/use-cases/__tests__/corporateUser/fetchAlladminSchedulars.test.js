const { fetchAlladminSchedulars } = require('../../corporateUser');
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

describe('fetchAlladminSchedulars', () => {
    it('should return all admin schedulers with report data', async () => {
        const mockResult = [
            { credentialId: 1, dailyReport: { isActive: true }, weeklyReport: null, monthlyReport: null }
        ];
        systemUser.findAll.mockResolvedValue(mockResult);

        const result = await fetchAlladminSchedulars();
        expect(result).toEqual(mockResult);
        expect(systemUser.findAll).toHaveBeenCalledWith(expect.objectContaining({
            attributes: ['dailyReport', 'weeklyReport', 'monthlyReport', 'credentialId'],
            raw: true,
            nest: true,
        }));
    });

    it('should return empty array when no admin schedulers found', async () => {
        systemUser.findAll.mockResolvedValue([]);

        const result = await fetchAlladminSchedulars();
        expect(result).toEqual([]);
    });
});
