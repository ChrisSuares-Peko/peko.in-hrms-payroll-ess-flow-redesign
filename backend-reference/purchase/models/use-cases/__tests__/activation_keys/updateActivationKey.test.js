const activation_keys = require('../../../entities/activation_keys');
const { updateActivationKey } = require('../../activation_keys');

jest.mock('../../../entities/activation_keys', () => ({
    update: jest.fn(),
}));

describe('activationKeys.updateActivationKey use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully update activation key', async () => {
        const params = {
            id: 1,
        };

        const data = {
            status: false,
            isAssigned: true,
        };

        const mockUpdateResult = [1]; 
        activation_keys.update.mockResolvedValue(mockUpdateResult);

        const result = await updateActivationKey(params, data);

        expect(activation_keys.update).toHaveBeenCalledTimes(1);
        expect(activation_keys.update).toHaveBeenCalledWith(data, {
            where: {
                id: params.id,
            },
        });

        expect(result).toEqual(mockUpdateResult);
    });

    it('should return [0] when no rows are updated', async () => {
        const params = { id: 999 };
        const data = { status: false };

        activation_keys.update.mockResolvedValue([0]);

        const result = await updateActivationKey(params, data);

        expect(activation_keys.update).toHaveBeenCalledWith(data, {
            where: {
                id: params.id,
            },
        });

        expect(result).toEqual([0]);
    });

    it('should throw error when activation_keys.update throws', async () => {
        const params = { id: 1 };
        const data = { status: false };

        const error = new Error('Database update failed');
        activation_keys.update.mockRejectedValue(error);

        await expect(updateActivationKey(params, data)).rejects.toThrow(error);
    });

    it('should throw TypeError when params is undefined', async () => {
        const data = { status: false };

        await expect(updateActivationKey(undefined, data)).rejects.toThrow(TypeError);
    });
});
