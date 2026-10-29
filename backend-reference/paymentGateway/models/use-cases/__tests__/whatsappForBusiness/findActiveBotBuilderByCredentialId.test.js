const { findActiveBotBuilderByCredentialId } = require('../../whatsappforBusiness');
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

describe('findActiveBotBuilderByCredentialId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return active bot builder subscription when found', async () => {
    const mockSubscription = {
      id: 1,
      status: 'ACTIVE',
      isCustom: true,
      package: { id: 2, packageName: 'Bot Builder' },
    };

    WhatsAppSubscription.findOne.mockResolvedValue(mockSubscription);

    const result = await findActiveBotBuilderByCredentialId('CRED123');

    expect(WhatsAppSubscription.findOne).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockSubscription);
  });

  it('should return null when no bot builder subscription found', async () => {
    WhatsAppSubscription.findOne.mockResolvedValue(null);

    const result = await findActiveBotBuilderByCredentialId('CRED_NONE');

    expect(result).toBeNull();
  });

  it('should return null on error', async () => {
    WhatsAppSubscription.findOne.mockRejectedValue(new Error('DB Error'));

    const result = await findActiveBotBuilderByCredentialId('CRED_ERR');

    expect(result).toBeNull();
  });
});
