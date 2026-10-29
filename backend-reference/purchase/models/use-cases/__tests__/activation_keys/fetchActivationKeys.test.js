const activation_keys = require('../../../entities/activation_keys');
const { Op } = require('sequelize');

const {
    fetchActivationKeys,
} = require('../../activation_keys');

// 🔹 Mock activation_keys entity
jest.mock('../../../entities/activation_keys', () => ({
    findAll: jest.fn(),
}));

describe('fetchActivationKeys', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch activation keys matching query and active status', async () => {
        const query = 'ABC';

        const mockResponse = [
            { id: 1, activation_key: 'ABC123' },
            { id: 2, activation_key: 'ABC456' },
        ];

        activation_keys.findAll.mockResolvedValue(mockResponse);

        const result = await fetchActivationKeys(query);

        expect(activation_keys.findAll).toHaveBeenCalledWith({
            where: {
                activation_key: {
                    [Op.like]: '%ABC%',
                },
                status: true,
            },
            attributes: ['id', 'activation_key'],
        });

        expect(result).toEqual(mockResponse);
    });

    it('should return empty array when no activation keys are found', async () => {
        const query = 'XYZ';

        activation_keys.findAll.mockResolvedValue([]);

        const result = await fetchActivationKeys(query);

        expect(activation_keys.findAll).toHaveBeenCalled();
        expect(result).toEqual([]);
    });

    it('should handle empty query string', async () => {
        const query = '';

        activation_keys.findAll.mockResolvedValue([]);

        const result = await fetchActivationKeys(query);

        expect(activation_keys.findAll).toHaveBeenCalledWith({
            where: {
                activation_key: {
                    [Op.like]: '%%',
                },
                status: true,
            },
            attributes: ['id', 'activation_key'],
        });

        expect(result).toEqual([]);
    });

    it('should throw error if database call fails', async () => {
        const query = 'ERR';

        activation_keys.findAll.mockRejectedValue(
            new Error('Database error')
        );

        await expect(fetchActivationKeys(query))
            .rejects
            .toThrow('Database error');
    });
});
