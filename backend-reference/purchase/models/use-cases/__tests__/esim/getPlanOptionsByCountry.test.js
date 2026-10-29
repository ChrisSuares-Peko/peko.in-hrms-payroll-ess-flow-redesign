const { getPlanOptionsByCountry } = require('../../../use-cases/esim');
const esim = require('../../../entities/esim');

jest.mock('../../../entities/esim', () => ({
    findAll: jest.fn(),
}));

describe('getPlanOptionsByCountry', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return grouped plan options by country', async () => {
        const mockCountry = 'United States';
        const mockProvider = 'Provider A';
        const mockPlans = [
            { dataMBs: 500, periodDays: 7, country: 'United States' },
            { dataMBs: 500, periodDays: 14, country: 'United States' },
            { dataMBs: 1000, periodDays: 30, country: 'United States' }
        ];

        const expectedOutput = [
            { dataMBs: 500, periodDays: [7, 14], country: 'United States' },
            { dataMBs: 1000, periodDays: [30], country: 'United States' }
        ];

        esim.findAll.mockResolvedValue(mockPlans);

        const result = await getPlanOptionsByCountry(mockCountry, mockProvider);

        expect(esim.findAll).toHaveBeenCalledWith({
            attributes: ['dataMBs', 'periodDays', 'country'],
            where: { country: mockCountry, status: true, provider: mockProvider },
            raw: true,
        });
        expect(result).toEqual(expectedOutput);
    });

    it('should return an empty array if no plans are found', async () => {
        const mockCountry = 'Invalid Country';
        esim.findAll.mockResolvedValue([]);

        const result = await getPlanOptionsByCountry(mockCountry);

        expect(result).toEqual([]);
    });

    it('should return false if an error occurs during query execution', async () => {
        const mockCountry = 'United States';
        const mockError = new Error('Database error');

        esim.findAll.mockRejectedValue(mockError);

        const result = await getPlanOptionsByCountry(mockCountry);

        expect(result).toBe(false);
    });
});
