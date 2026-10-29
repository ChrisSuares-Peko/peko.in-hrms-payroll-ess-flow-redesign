const { getUniqueCountries } = require('../../../use-cases/esim');
const esim = require('../../../entities/esim');
const { fn, col } = require('sequelize');

jest.mock('../../../entities/esim', () => ({
    findAll: jest.fn(),
}));

describe('getUniqueCountries', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a list of unique countries where eSIMs are active', async () => {
        const mockCountries = [
            { country: 'United States' },
            { country: 'Canada' },
            { country: 'Germany' }
        ];

        esim.findAll.mockResolvedValue(mockCountries);

        const result = await getUniqueCountries();

        expect(esim.findAll).toHaveBeenCalledWith({
            attributes: [[fn('DISTINCT', col('country')), 'country']],
            where: { status: true },
            order: [['country', 'ASC']],
            raw: true,
        });
        expect(result).toEqual(mockCountries);
    });

    it('should return an empty array if no unique countries are found', async () => {
        esim.findAll.mockResolvedValue([]);

        const result = await getUniqueCountries();

        expect(result).toEqual([]);
    });

    it('should return false if an error occurs during query execution', async () => {
        const mockError = new Error('Database error');

        esim.findAll.mockRejectedValue(mockError);

        const result = await getUniqueCountries();

        expect(result).toBe(false);
    });
});
