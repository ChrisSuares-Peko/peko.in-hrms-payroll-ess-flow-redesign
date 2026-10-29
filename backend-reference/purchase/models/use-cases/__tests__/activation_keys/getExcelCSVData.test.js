const activation_keys = require('../../../entities/activation_keys');
const cryptoJSEncryption = require('../../../../utils/encryptionUtils');

const {
    getExcelCSVData,
} = require('../../activation_keys');

jest.mock('../../../entities/activation_keys', () => ({
    findAll: jest.fn(),
}));


jest.mock('../../../../utils/encryptionUtils', () => ({
    decrypt: jest.fn(),
}));

describe('getExcelCSVData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.CRYPTOJS_ENCRYPTION_KEY = 'test-secret';
    });

    it('should fetch activation keys and return formatted CSV data', async () => {
        const mockDbData = [
            {
                id: 1,
                activation_key: 'encryptedKey1',
                planId: 10,
            },
            {
                id: 2,
                activation_key: 'encryptedKey2',
                planId: 20,
            },
        ];

        activation_keys.findAll.mockResolvedValue(mockDbData);

        cryptoJSEncryption.decrypt
            .mockReturnValueOnce('DECRYPTED_KEY_1')
            .mockReturnValueOnce('DECRYPTED_KEY_2');

        const result = await getExcelCSVData();

        expect(activation_keys.findAll).toHaveBeenCalledWith({
            attributes: ['id', 'activation_key', 'planId'],
            order: [['createdAt', 'DESC']],
            raw: true,
        });

        expect(cryptoJSEncryption.decrypt).toHaveBeenCalledTimes(2);

        expect(result).toEqual([
            {
                ID: 1,
                'Activation Key': 'DECRYPTED_KEY_1',
            },
            {
                ID: 2,
                'Activation Key': 'DECRYPTED_KEY_2',
            },
        ]);
    });

    it('should return "Not Available" when decrypted activation key is empty', async () => {
        const mockDbData = [
            {
                id: 3,
                activation_key: 'encryptedKey3',
                planId: 30,
            },
        ];

        activation_keys.findAll.mockResolvedValue(mockDbData);
        cryptoJSEncryption.decrypt.mockReturnValue('');

        const result = await getExcelCSVData();

        expect(result).toEqual([
            {
                ID: 3,
                'Activation Key': 'Not Available',
            },
        ]);
    });

    it('should return empty array when no activation keys exist', async () => {
        activation_keys.findAll.mockResolvedValue([]);

        const result = await getExcelCSVData();

        expect(result).toEqual([]);
        expect(cryptoJSEncryption.decrypt).not.toHaveBeenCalled();
    });

    it('should throw error if database call fails', async () => {
        activation_keys.findAll.mockRejectedValue(
            new Error('Database failure')
        );

        await expect(getExcelCSVData())
            .rejects
            .toThrow('Database failure');
    });
});
