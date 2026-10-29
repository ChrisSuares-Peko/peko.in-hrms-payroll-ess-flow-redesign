const { findAllReferralCodes } = require('../../referral_codes');
const referral_codes = require('../../../entities/referral_codes');

jest.mock('../../../entities/referral_codes');

describe('findAllReferralCodes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find all active referral codes', async () => {
        const mockResult = [
            { id: 1, referralCode: 'REF001', status: true },
            { id: 2, referralCode: 'REF002', status: true },
        ];
        referral_codes.findAll.mockResolvedValue(mockResult);

        const result = await findAllReferralCodes();
        expect(referral_codes.findAll).toHaveBeenCalledWith({ where: { status: true } });
        expect(result).toEqual(mockResult);
    });

    it('should return empty array if no active codes', async () => {
        referral_codes.findAll.mockResolvedValue([]);

        const result = await findAllReferralCodes();
        expect(result).toEqual([]);
    });
});
