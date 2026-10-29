const activation_keys = require('../../../entities/activation_keys');
const { findOneByKey } = require('../../activation_keys');

jest.mock('../../../entities/activation_keys', () => ({
    findOne: jest.fn(),
}));

describe('activationKeys.findOneByKey use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return activation key when matching record exists', async () => {
        const key = 'encrypted-activation-key';
        const planId = 5;

        const mockActivationKey = {
            id: 1,
            activation_key: key,
            planId,
            isAssigned: false,
        };

        activation_keys.findOne.mockResolvedValue(mockActivationKey);

        const result = await findOneByKey(key, planId);

        expect(activation_keys.findOne).toHaveBeenCalledTimes(1);
        expect(activation_keys.findOne).toHaveBeenCalledWith({
            where: {
                activation_key: key,
                planId,
                isAssigned: false,
            },
        });

        expect(result).toEqual(mockActivationKey);
    });

    it('should return null when no matching activation key exists', async () => {
        const key = 'invalid-key';
        const planId = 10;

        activation_keys.findOne.mockResolvedValue(null);

        const result = await findOneByKey(key, planId);

        expect(activation_keys.findOne).toHaveBeenCalledWith({
            where: {
                activation_key: key,
                planId,
                isAssigned: false,
            },
        });

        expect(result).toBeNull();
    });

    it('should throw error when activation_keys.findOne throws', async () => {
        const key = 'some-key';
        const planId = 2;
        const error = new Error('Database error');

        activation_keys.findOne.mockRejectedValue(error);

        await expect(findOneByKey(key, planId)).rejects.toThrow(error);
    });

    it('should handle undefined key', async () => {
        const planId = 3;

        activation_keys.findOne.mockResolvedValue(null);

        const result = await findOneByKey(undefined, planId);

        expect(activation_keys.findOne).toHaveBeenCalledWith({
            where: {
                activation_key: undefined,
                planId,
                isAssigned: false,
            },
        });

        expect(result).toBeNull();
    });

    it('should handle undefined planId', async () => {
        const key = 'activation-key';

        activation_keys.findOne.mockResolvedValue(null);

        const result = await findOneByKey(key, undefined);

        expect(activation_keys.findOne).toHaveBeenCalledWith({
            where: {
                activation_key: key,
                planId: undefined,
                isAssigned: false,
            },
        });

        expect(result).toBeNull();
    });
});
