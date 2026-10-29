const activation_keys = require('../../../entities/activation_keys');
const { findAllActivationKeys } = require('../../activation_keys');

jest.mock('../../../entities/activation_keys', () => ({
    findAll: jest.fn(),
}));

describe('activationKeys.findAllActivationKeys use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all active activation keys', async () => {
        const mockActivationKeys = [
            { id: 1, activation_key: 'key-1', status: true },
            { id: 2, activation_key: 'key-2', status: true },
        ];

        activation_keys.findAll.mockResolvedValue(mockActivationKeys);

        const result = await findAllActivationKeys();

        expect(activation_keys.findAll).toHaveBeenCalledTimes(1);
        expect(activation_keys.findAll).toHaveBeenCalledWith({
            where: {
                status: true,
            },
        });

        expect(result).toEqual(mockActivationKeys);
    });

    it('should return empty array when no active activation keys exist', async () => {
        activation_keys.findAll.mockResolvedValue([]);

        const result = await findAllActivationKeys();

        expect(activation_keys.findAll).toHaveBeenCalledWith({
            where: {
                status: true,
            },
        });

        expect(result).toEqual([]);
    });

    it('should throw error when activation_keys.findAll throws', async () => {
        const error = new Error('Database error');

        activation_keys.findAll.mockRejectedValue(error);

        await expect(findAllActivationKeys()).rejects.toThrow(error);
    });
});
