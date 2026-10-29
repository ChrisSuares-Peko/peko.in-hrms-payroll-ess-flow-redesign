const activation_keys = require('../../../entities/activation_keys');
const { create } = require('../../activation_keys');

jest.mock('../../../entities/activation_keys', () => ({
    create: jest.fn(),
}));

describe('activationKeys create use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create activation key successfully', async () => {
        const params = {
            key: 'ACT-123',
            status: 'ACTIVE',
            expiresAt: '2026-01-01',
        };

        const mockResult = {
            id: 1,
            ...params,
        };

        activation_keys.create.mockResolvedValue(mockResult);

        const result = await create(params);

        expect(activation_keys.create).toHaveBeenCalledTimes(1);
        expect(activation_keys.create).toHaveBeenCalledWith(params);
        expect(result).toEqual(mockResult);
    });

    it('should return false when activation key creation returns null', async () => {
        const params = {
            key: 'ACT-123',
        };

        activation_keys.create.mockResolvedValue(null);

        const result = await create(params);

        expect(activation_keys.create).toHaveBeenCalledWith(params);
        expect(result).toBe(false);
    });

    it('should return false when activation key creation returns undefined', async () => {
        const params = {
            key: 'ACT-123',
        };

        activation_keys.create.mockResolvedValue(undefined);

        const result = await create(params);

        expect(result).toBe(false);
    });

    it('should throw error when activation_keys.create throws', async () => {
        const params = {
            key: 'ACT-123',
        };

        const error = new Error('DB error');
        activation_keys.create.mockRejectedValue(error);

        await expect(create(params)).rejects.toThrow(error);
    });
});
