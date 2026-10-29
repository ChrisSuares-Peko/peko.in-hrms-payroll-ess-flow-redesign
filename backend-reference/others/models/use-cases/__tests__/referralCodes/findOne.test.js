const { findOne } = require('../../referral_codes');
const referral_codes = require('../../../entities/referral_codes');

jest.mock('../../../entities/referral_codes');

describe('findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find a referral code by id', async () => {
        const mockResult = { id: 1, referralCode: 'REF001' };
        referral_codes.findOne.mockResolvedValue(mockResult);

        const result = await findOne(1);
        expect(referral_codes.findOne).toHaveBeenCalledWith({
            where: { id: 1 },
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockResult);
    });

    it('should return null if not found', async () => {
        referral_codes.findOne.mockResolvedValue(null);

        const result = await findOne(999);
        expect(result).toBeNull();
    });
});
