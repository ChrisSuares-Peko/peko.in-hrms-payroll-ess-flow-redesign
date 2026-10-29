const { fetchUniqueCountries } = require('../../attestation');
const attestationCategory = require('../../../entities/attestationCategory');
const { Op } = require('sequelize');

jest.mock('../../../entities/attestationCategory');

describe('fetchUniqueCountries', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted country list with search text', async () => {
        const mockData = [
            { countryCode: 'AE', country: 'United Arab Emirates' },
            { countryCode: 'IN', country: 'India' },
        ];
        attestationCategory.findAll.mockResolvedValue(mockData);

        const result = await fetchUniqueCountries('India');

        expect(attestationCategory.findAll).toHaveBeenCalledWith({
            attributes: ['countryCode', 'country'],
            where: { country: { [Op.like]: '%India%' } },
            group: ['countryCode', 'country'],
            order: [['country', 'ASC']],
        });
        expect(result).toEqual([
            { value: 'AE', label: 'United Arab Emirates' },
            { value: 'IN', label: 'India' },
        ]);
    });

    it('should return all countries when no search text', async () => {
        const mockData = [{ countryCode: 'US', country: 'United States' }];
        attestationCategory.findAll.mockResolvedValue(mockData);

        const result = await fetchUniqueCountries('');

        expect(attestationCategory.findAll).toHaveBeenCalledWith({
            attributes: ['countryCode', 'country'],
            where: {},
            group: ['countryCode', 'country'],
            order: [['country', 'ASC']],
        });
        expect(result).toEqual([{ value: 'US', label: 'United States' }]);
    });

    it('should return empty array when no countries found', async () => {
        attestationCategory.findAll.mockResolvedValue([]);

        const result = await fetchUniqueCountries('xyz');

        expect(result).toEqual([]);
    });
});
