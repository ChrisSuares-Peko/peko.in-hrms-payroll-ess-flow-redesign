const { findCitiesByCountry } = require('../../cities');
const cities = require('../../../entities/cities');
const { Op } = require('sequelize');

jest.mock('../../../entities/cities', () => ({
    findAll: jest.fn(),
}));

describe('cities use-cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findCitiesByCountry', () => {
        it('should return cities for a given country', async () => {
            const mockCities = [
                { cityName: 'DUBAI' },
                { cityName: 'ABU DHABI' },
            ];
            cities.findAll.mockResolvedValue(mockCities);

            const result = await findCitiesByCountry('uae');

            expect(cities.findAll).toHaveBeenCalledWith({
                where: {
                    countryName: { [Op.like]: '%UAE%' },
                },
                attributes: ['cityName'],
                raw: true,
            });
            expect(result).toEqual(mockCities);
        });

        it('should filter by city name when city param is provided', async () => {
            const mockCities = [{ cityName: 'DUBAI' }];
            cities.findAll.mockResolvedValue(mockCities);

            const result = await findCitiesByCountry('uae', 'dubai');

            expect(cities.findAll).toHaveBeenCalledWith({
                where: {
                    countryName: { [Op.like]: '%UAE%' },
                    cityName: { [Op.like]: '%DUBAI%' },
                },
                attributes: ['cityName'],
                raw: true,
            });
            expect(result).toEqual(mockCities);
        });

        it('should return empty array when no cities found', async () => {
            cities.findAll.mockResolvedValue([]);

            const result = await findCitiesByCountry('xyz');

            expect(result).toEqual([]);
        });

        it('should handle errors', async () => {
            cities.findAll.mockRejectedValue(new Error('DB error'));

            await expect(findCitiesByCountry('uae')).rejects.toThrow('DB error');
        });
    });
});
