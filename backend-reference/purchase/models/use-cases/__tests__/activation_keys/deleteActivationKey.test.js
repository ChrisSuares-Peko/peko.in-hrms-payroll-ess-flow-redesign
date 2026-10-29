const activationKeyService = require('../../activation_keys');
const activation_keys = require('../../../entities/activation_keys');

jest.mock('../../../entities/activation_keys', () => ({
    destroy: jest.fn(),
}));

describe('deleteActivationKey', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should delete activation key successfully', async () => {
        const params = { id: 1 };

        activation_keys.destroy.mockResolvedValue(1);

        const result = await activationKeyService.deleteActivationKey(params);

        expect(activation_keys.destroy).toHaveBeenCalledWith({
            where: {
                id: params.id,
            },
        });

        expect(result).toBe(1);
    });

    it('should return 0 if no activation key is deleted', async () => {
        const params = { id: 999 };

        activation_keys.destroy.mockResolvedValue(0);

        const result = await activationKeyService.deleteActivationKey(params);

        expect(activation_keys.destroy).toHaveBeenCalled();
        expect(result).toBe(0);
    });

    it('should throw error if destroy fails', async () => {
        const params = { id: 1 };

        activation_keys.destroy.mockRejectedValue(new Error('DB error'));

        await expect(
            activationKeyService.deleteActivationKey(params)
        ).rejects.toThrow('DB error');

        expect(activation_keys.destroy).toHaveBeenCalled();
    });
});
