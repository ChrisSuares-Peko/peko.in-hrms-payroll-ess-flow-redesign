const { fetchReferralReward } = require('../../referral_codes');
const setting = require('../../../entities/setting');

jest.mock('../../../entities/setting');

describe('fetchReferralReward', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return referral reward details', async () => {
        const mockDetails = { reward: 100 };
        setting.findOne.mockResolvedValue({ details: mockDetails });

        const result = await fetchReferralReward();
        expect(setting.findOne).toHaveBeenCalledWith({ where: { name: 'referralReward' } });
        expect(result).toEqual(mockDetails);
    });

    it('should return undefined if setting not found', async () => {
        setting.findOne.mockResolvedValue(null);

        const result = await fetchReferralReward();
        expect(result).toBeUndefined();
    });
});
