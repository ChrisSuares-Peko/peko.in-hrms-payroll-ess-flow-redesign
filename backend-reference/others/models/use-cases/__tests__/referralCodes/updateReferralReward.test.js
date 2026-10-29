const { updateReferralReward } = require('../../referral_codes');
const setting = require('../../../entities/setting');

jest.mock('../../../entities/setting');

describe('updateReferralReward', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the referral reward', async () => {
        setting.update.mockResolvedValue({ details: { reward: 200 } });

        const result = await updateReferralReward(200);
        expect(setting.update).toHaveBeenCalledWith(
            expect.objectContaining({ details: expect.anything() }),
            { where: { name: 'referralReward' } }
        );
        expect(result).toEqual({ reward: 200 });
    });

    it('should return undefined if update returns null', async () => {
        setting.update.mockResolvedValue(null);

        const result = await updateReferralReward(300);
        expect(result).toBeUndefined();
    });
});
