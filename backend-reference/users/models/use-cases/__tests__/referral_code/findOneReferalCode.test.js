const { findOneReferalCode } = require('../../../use-cases/referral_codes'); // Adjust path as needed
const referral_codes = require('../../../entities/referral_codes');

jest.mock('../../../entities/referral_codes', () => ({
    findOne: jest.fn(),
}));

describe('findOneReferalCode', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the referral code data when found', async () => {
        const mockReferralCode = 'TESTCODE';
        const mockReferralCodeData = {
            id: 1,
            referralCode: mockReferralCode,
            status: true,
            // ... other properties
        };

        referral_codes.findOne.mockResolvedValue(mockReferralCodeData);

        const result = await findOneReferalCode(mockReferralCode);

        expect(referral_codes.findOne).toHaveBeenCalledWith({
            where: {
                referralCode: mockReferralCode,
                status: true,
            },
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockReferralCodeData);
    });

    it('should return null when no matching referral code is found', async () => {
        const mockReferralCode = 'NONEXISTENT';

        referral_codes.findOne.mockResolvedValue(null);

        const result = await findOneReferalCode(mockReferralCode);

        expect(referral_codes.findOne).toHaveBeenCalledWith({
            where: {
                referralCode: mockReferralCode,
                status: true,
            },
            raw: true,
            nest: true,
        });
        expect(result).toBeNull();
    });

    it('should handle errors during database query', async () => {
        const mockReferralCode = 'TESTCODE';
        const mockError = new Error('Database error');

        referral_codes.findOne.mockRejectedValue(mockError);

        await expect(findOneReferalCode(mockReferralCode)).rejects.toEqual(mockError);

        expect(referral_codes.findOne).toHaveBeenCalledWith({
            where: {
                referralCode: mockReferralCode,
                status: true,
            },
            raw: true,
            nest: true,
        });
    });
});