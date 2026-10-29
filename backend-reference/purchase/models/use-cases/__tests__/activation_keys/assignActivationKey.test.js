const activation_keys = require('../../../entities/activation_keys');
const { assignActivationKey } = require('../../activation_keys');

jest.mock('../../../entities/activation_keys', () => ({
    update: jest.fn(),
}));

describe('activationKeys.assignActivationKey use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully assign activation key', async () => {
        const data = {
            isAssigned: true,
            assignedTo: 123,
        };

        const params = {
            keyId: 1,
        };

        const mockUpdateResult = [1]; 
        activation_keys.update.mockResolvedValue(mockUpdateResult);

        const result = await assignActivationKey(data, params);

        expect(activation_keys.update).toHaveBeenCalledTimes(1);
        expect(activation_keys.update).toHaveBeenCalledWith(data, {
            where: {
                id: params.keyId,
                isAssigned: false,
            },
        });

        expect(result).toEqual(mockUpdateResult);
    });

    it('should return [0] when activation key is already assigned or not found', async () => {
        const data = { isAssigned: true };
        const params = { keyId: 999 };

        activation_keys.update.mockResolvedValue([0]);

        const result = await assignActivationKey(data, params);

        expect(activation_keys.update).toHaveBeenCalledWith(data, {
            where: {
                id: params.keyId,
                isAssigned: false,
            },
        });

        expect(result).toEqual([0]);
    });

    it('should throw error when activation_keys.update throws', async () => {
        const data = { isAssigned: true };
        const params = { keyId: 1 };

        const error = new Error('Database update failed');
        activation_keys.update.mockRejectedValue(error);

        await expect(assignActivationKey(data, params)).rejects.toThrow(error);
    });

    it('should throw TypeError when params is undefined', async () => {
        const data = { isAssigned: true };

        await expect(assignActivationKey(data, undefined)).rejects.toThrow(TypeError);
    });
});
