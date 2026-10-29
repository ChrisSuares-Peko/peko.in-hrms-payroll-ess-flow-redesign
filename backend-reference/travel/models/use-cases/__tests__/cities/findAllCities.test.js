const { findAllCities } = require('../../../use-cases/cities');
const cities = require('../../../entities/cities');
const { Op } = require('sequelize');

jest.mock('../../../entities/cities', () => ({
    findAll: jest.fn(),
}));

describe('findAllCities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a list of cities that match the query', async () => {
        const mockQuery = 'New';
        const mockCities = [
            { id: 1, cityName: 'New York', countryName: 'USA' },
            { id: 2, cityName: 'New Delhi', countryName: 'India' },
        ];

        cities.findAll.mockResolvedValue(mockCities);

        const result = await findAllCities(mockQuery);

        expect(cities.findAll).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { cityName: { [Op.like]: `%${mockQuery.toUpperCase()}%` } },
                    { countryName: { [Op.like]: `%${mockQuery.toUpperCase()}%` } },
                ],
            },
            attributes: ['cityName', 'countryName', 'id'],
            raw: true,
        });
        expect(result).toEqual(mockCities);
    });

    it('should return an empty array if no matching cities are found', async () => {
        const mockQuery = 'NonExistentCity';
        cities.findAll.mockResolvedValue([]);

        const result = await findAllCities(mockQuery);

        expect(result).toEqual([]);
    });

    it('should handle errors if database query fails', async () => {
        const mockQuery = 'New';
        const mockError = new Error('Database error');

        cities.findAll.mockRejectedValue(mockError);

        await expect(findAllCities(mockQuery)).rejects.toThrow('Database error');
    });
});
