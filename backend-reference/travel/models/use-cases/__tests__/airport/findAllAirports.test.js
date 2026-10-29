const { findAllAirports } = require('../../../use-cases/airport');
const airport = require('../../../entities/airport');
const { Op } = require('sequelize');

jest.mock('../../../entities/airport', () => ({
    findAll: jest.fn(),
}));

describe('findAllAirports', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

     it('should return a list of airports that match the query', async () => {
        const mockQuery = 'New';
        const mockAirports = [
            { id: 1, airportName: 'New York Airport', airportCode: 'NYA', cityName: 'New York' },
            { id: 2, airportName: 'Newark Airport', airportCode: 'EWR', cityName: 'Newark' },
        ];

        airport.findAll.mockResolvedValue(mockAirports);

        const result = await findAllAirports(mockQuery);

        expect(airport.findAll).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                [Op.or]: [
                    { airportName: { [Op.like]: `%${mockQuery}%` } },
                    { airportCode: { [Op.like]: `%${mockQuery}%` } },
                    { cityName: { [Op.like]: `%${mockQuery}%` } },
                ],
            },
            attributes: { exclude: ['updatedAt', 'createdAt'] },
            // Accept any literal order expression instead of deep matching
            order: expect.any(Array),
        }));

        expect(result).toEqual(mockAirports);
    });

    it('should return an empty array if no matching airports are found', async () => {
        const mockQuery = 'NonExistentAirport';
        airport.findAll.mockResolvedValue([]);

        const result = await findAllAirports(mockQuery);

        expect(result).toEqual([]);
    });

    it('should handle errors if database query fails', async () => {
        const mockQuery = 'New';
        const mockError = new Error('Database error');

        airport.findAll.mockRejectedValue(mockError);

        await expect(findAllAirports(mockQuery)).rejects.toThrow('Database error');
    });
});
