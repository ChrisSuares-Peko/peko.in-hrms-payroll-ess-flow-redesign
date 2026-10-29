const { fetchAllCorporateSchedulars } = require('../../corporateUser');
const corporateUser = require('../../../entities/corporateUser');

jest.mock('@logtail/node', () => ({
    Logtail: jest.fn().mockImplementation(() => ({
        info: jest.fn(),
        error: jest.fn(),
    })),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('fetchAllCorporateSchedulars', () => {
    it('should return all corporate schedulers with report data', async () => {
        const mockResult = [
            { credentialId: 1, dailyReport: { isActive: true }, weeklyReport: null, monthlyReport: null }
        ];
        corporateUser.findAll.mockResolvedValue(mockResult);

        const result = await fetchAllCorporateSchedulars();
        expect(result).toEqual(mockResult);
        expect(corporateUser.findAll).toHaveBeenCalledWith(expect.objectContaining({
            attributes: ['dailyReport', 'weeklyReport', 'monthlyReport', 'credentialId'],
            raw: true,
            nest: true,
        }));
    });

    it('should return empty array when no corporate schedulers found', async () => {
        corporateUser.findAll.mockResolvedValue([]);

        const result = await fetchAllCorporateSchedulars();
        expect(result).toEqual([]);
    });
});
