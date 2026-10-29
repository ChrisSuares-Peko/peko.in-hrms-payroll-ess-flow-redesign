const { findActiveSubscriptionByCredentialId } = require('../../whatsappforBusiness');
const WhatsAppSubscription = require('../../../entities/whatsappSubscription');

jest.mock('../../../entities/whatsappSubscription', () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../../entities/whatsappBusiness', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../entities/package', () => ({
  findOne: jest.fn(),
}));

describe('findActiveSubscriptionByCredentialId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return active subscription when found', async () => {
    const mockSubscription = {
      id: 1,
      status: 'ACTIVE',
      subscriptionStartDate: '2026-01-01',
      package: { id: 1, packageName: 'Gold' },
    };

    WhatsAppSubscription.findOne.mockResolvedValue(mockSubscription);

    const result = await findActiveSubscriptionByCredentialId('CRED123');

    expect(WhatsAppSubscription.findOne).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockSubscription);
  });

  it('should return null when no active subscription found', async () => {
    WhatsAppSubscription.findOne.mockResolvedValue(null);

    const result = await findActiveSubscriptionByCredentialId('CRED_NONE');

    expect(result).toBeNull();
  });

  it('should return null on error', async () => {
    WhatsAppSubscription.findOne.mockRejectedValue(new Error('DB Error'));

    const result = await findActiveSubscriptionByCredentialId('CRED_ERR');

    expect(result).toBeNull();
  });
});
