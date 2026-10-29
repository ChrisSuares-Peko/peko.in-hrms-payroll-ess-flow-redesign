const activation_keys = require('../../../entities/activation_keys');
const cryptoJSEncryption = require('../../../../utils/encryptionUtils');
const { Op } = require('sequelize');

const {
    findAllActivationKeysAndCount,
} = require('../../activation_keys');

jest.mock('../../../entities/activation_keys', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/encryptionUtils', () => ({
    decrypt: jest.fn(),
}));

describe('findAllActivationKeysAndCount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.CRYPTOJS_ENCRYPTION_KEY = 'test_key';
    });

    it('should fetch activation keys, decrypt and mask them correctly', async () => {
        const params = {
            start: 0,
            length: 10,
            searchText: 'ABC',
            order: 'ASC',
            column: 1, 
        };

        activation_keys.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [
                {
                    id: 1,
                    activation_key: 'encrypted_key_123',
                },
            ],
        });

        cryptoJSEncryption.decrypt.mockReturnValue('ABCD1234');

        const result = await findAllActivationKeysAndCount(params);

      
        expect(activation_keys.findAndCountAll).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    {
                        id: {
                            [Op.like]: '%ABC%',
                        },
                    },
                    {
                        activation_key: {
                            [Op.like]: '%ABC%',
                        },
                    },
                ],
            },
            order: [['activation_key', 'ASC']],
            limit: 10,
            offset: 0,
            raw: true,
            nest: true,
        });

     
        expect(cryptoJSEncryption.decrypt).toHaveBeenCalledWith(
            'encrypted_key_123',
            'test_key'
        );

      
        expect(result.rows[0].activation_key).toBe('AB34');
        expect(result.count).toBe(1);
    });

    it('should default to createdAt when column index is invalid', async () => {
        const params = {
            start: 0,
            length: 5,
            searchText: '',
            order: 'DESC',
            column: 99,
        };

        activation_keys.findAndCountAll.mockResolvedValue({
            count: 0,
            rows: [],
        });

        const result = await findAllActivationKeysAndCount(params);

        expect(activation_keys.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                order: [['createdAt', 'DESC']],
            })
        );

        expect(result.rows).toEqual([]);
        expect(result.count).toBe(0);
    });

    it('should handle short activation keys (length <= 4)', async () => {
        const params = {
            start: 0,
            length: 10,
            searchText: '',
            order: 'ASC',
            column: 0,
        };

        activation_keys.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [
                {
                    id: 2,
                    activation_key: 'enc_short',
                },
            ],
        });

        cryptoJSEncryption.decrypt.mockReturnValue('ABC');

        const result = await findAllActivationKeysAndCount(params);

     
        expect(result.rows[0].activation_key).toBe('A##');
    });

    it('should throw error if DB query fails', async () => {
        const params = {
            start: 0,
            length: 10,
            searchText: '',
            order: 'ASC',
            column: 0,
        };

        activation_keys.findAndCountAll.mockRejectedValue(
            new Error('DB error')
        );

        await expect(
            findAllActivationKeysAndCount(params)
        ).rejects.toThrow('DB error');
    });
});
