const activation_keys = require('../../../entities/activation_keys');

const {
    checkActivationKeyExists,
} = require('../../activation_keys');


jest.mock('../../../entities/activation_keys', () => ({
    findOne: jest.fn(),
}));

describe('checkActivationKeyExists', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return true when an unassigned activation key exists', async () => {
        const planId = 1;

        activation_keys.findOne.mockResolvedValue({
            id: 10,
            planId,
            isAssigned: false,
        });

        const result = await checkActivationKeyExists(planId);

        expect(activation_keys.findOne).toHaveBeenCalledWith({
            where: {
                planId,
                isAssigned: false,
            },
        });

        expect(result).toBe(true);
    });

    it('should return false when no activation key exists', async () => {
        const planId = 2;

        activation_keys.findOne.mockResolvedValue(null);

        const result = await checkActivationKeyExists(planId);

        expect(activation_keys.findOne).toHaveBeenCalled();
        expect(result).toBe(false);
    });

    it('should return false when activation_keys.findOne returns undefined', async () => {
        const planId = 3;

        activation_keys.findOne.mockResolvedValue(undefined);

        const result = await checkActivationKeyExists(planId);

        expect(result).toBe(false);
    });

    it('should throw error if database query fails', async () => {
        const planId = 4;

        activation_keys.findOne.mockRejectedValue(
            new Error('Database error')
        );

        await expect(checkActivationKeyExists(planId))
            .rejects
            .toThrow('Database error');
    });
});
