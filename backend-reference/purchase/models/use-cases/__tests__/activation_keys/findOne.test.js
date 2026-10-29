const activation_keys = require('../../../entities/activation_keys');
const { findOne } = require('../../activation_keys');

jest.mock('../../../entities/activation_keys', () => ({
    findOne: jest.fn(),
}));

describe('activationKeys.findOne use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return activation key when record exists', async () => {
        const params = 10;
        const mockActivationKey = {
            id: 1,
            planId: 10,
            isAssigned: false,
            activation_key: 'encrypted-key',
        };

        activation_keys.findOne.mockResolvedValue(mockActivationKey);

        const result = await findOne(params);

        expect(activation_keys.findOne).toHaveBeenCalledTimes(1);
        expect(activation_keys.findOne).toHaveBeenCalledWith({
            where: {
                planId: params,
                isAssigned: false,
            },
            raw: true,
            nest: true,
        });

        expect(result).toEqual(mockActivationKey);
    });

    it('should return null when no activation key is found', async () => {
        const params = 20;

        activation_keys.findOne.mockResolvedValue(null);

        const result = await findOne(params);

        expect(activation_keys.findOne).toHaveBeenCalledWith({
            where: {
                planId: params,
                isAssigned: false,
            },
            raw: true,
            nest: true,
        });

        expect(result).toBeNull();
    });

    it('should throw error when activation_keys.findOne throws', async () => {
        const params = 30;
        const error = new Error('Database error');

        activation_keys.findOne.mockRejectedValue(error);

        await expect(findOne(params)).rejects.toThrow(error);
    });

    it('should handle params as undefined', async () => {
        activation_keys.findOne.mockResolvedValue(null);

        const result = await findOne(undefined);

        expect(activation_keys.findOne).toHaveBeenCalledWith({
            where: {
                planId: undefined,
                isAssigned: false,
            },
            raw: true,
            nest: true,
        });

        expect(result).toBeNull();
    });

    it('should handle params as null', async () => {
        activation_keys.findOne.mockResolvedValue(null);

        const result = await findOne(null);

        expect(activation_keys.findOne).toHaveBeenCalledWith({
            where: {
                planId: null,
                isAssigned: false,
            },
            raw: true,
            nest: true,
        });

        expect(result).toBeNull();
    });
});
