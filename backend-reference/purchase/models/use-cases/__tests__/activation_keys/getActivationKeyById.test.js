const activation_keys = require('../../../entities/activation_keys');
const cryptoJSEncryption = require('../../../../utils/encryptionUtils');
const { getActivationKeyById } = require('../../activation_keys');


jest.mock('../../../entities/activation_keys', () => ({
    findByPk: jest.fn(),
}));


jest.mock('../../../../utils/encryptionUtils', () => ({
    decrypt: jest.fn(),
}));

describe('getActivationKeyById use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.CRYPTOJS_ENCRYPTION_KEY = 'test-secret-key';
    });

    it('should return decrypted activation key when activation_key exists', async () => {
        const params = 1;

        activation_keys.findByPk.mockResolvedValue({
            activation_key: 'encrypted-key',
        });

        cryptoJSEncryption.decrypt.mockReturnValue('decrypted-key');

        const result = await getActivationKeyById(params);

        expect(activation_keys.findByPk).toHaveBeenCalledTimes(1);
        expect(activation_keys.findByPk).toHaveBeenCalledWith(params);

        expect(cryptoJSEncryption.decrypt).toHaveBeenCalledTimes(1);
        expect(cryptoJSEncryption.decrypt).toHaveBeenCalledWith(
            'encrypted-key',
            'test-secret-key'
        );

        expect(result).toBe('decrypted-key');
    });

    it('should return undefined when activation_key is null', async () => {
        const params = 1;

        activation_keys.findByPk.mockResolvedValue({
            activation_key: null,
        });

        const result = await getActivationKeyById(params);

        expect(cryptoJSEncryption.decrypt).not.toHaveBeenCalled();
        expect(result).toBeNull();
    });

    it('should return undefined when activation_key is missing', async () => {
        const params = 1;

        activation_keys.findByPk.mockResolvedValue({});

        const result = await getActivationKeyById(params);

        expect(cryptoJSEncryption.decrypt).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });

    it('should throw error when findByPk throws', async () => {
        const params = 1;
        const error = new Error('DB error');

        activation_keys.findByPk.mockRejectedValue(error);

        await expect(getActivationKeyById(params)).rejects.toThrow(error);
    });

    it('should throw error when decrypt throws', async () => {
        const params = 1;
        const error = new Error('Decrypt failed');

        activation_keys.findByPk.mockResolvedValue({
            activation_key: 'encrypted-key',
        });

        cryptoJSEncryption.decrypt.mockImplementation(() => {
            throw error;
        });

        await expect(getActivationKeyById(params)).rejects.toThrow(error);
    });
});
