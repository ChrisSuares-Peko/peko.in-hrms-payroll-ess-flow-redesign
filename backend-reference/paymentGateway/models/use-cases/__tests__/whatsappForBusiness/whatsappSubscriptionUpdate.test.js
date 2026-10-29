const { whatsappSubscriptionUpdate } = require('../../whatsappforBusiness');
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

describe('whatsappSubscriptionUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return error when invoiceId is not provided', async () => {
    const result = await whatsappSubscriptionUpdate({ id: 1 }, { status: 'ACTIVE' });

    expect(result).toEqual({
      error: true,
      message: 'Invoice Id is not provided',
    });
    expect(WhatsAppSubscription.update).not.toHaveBeenCalled();
  });

  it('should update subscription and return result', async () => {
    const mockParams = { id: 1 };
    const mockData = { status: 'ACTIVE', invoiceId: 'INV123' };
    const mockResult = [1];

    WhatsAppSubscription.update.mockResolvedValue(mockResult);

    const result = await whatsappSubscriptionUpdate(mockParams, mockData);

    expect(WhatsAppSubscription.update).toHaveBeenCalledWith(mockData, { where: mockParams });
    expect(result).toEqual({ subscription: mockResult });
  });

  it('should handle errors and return error response', async () => {
    WhatsAppSubscription.update.mockRejectedValue(new Error('DB Error'));

    const result = await whatsappSubscriptionUpdate({ id: 1 }, { invoiceId: 'INV123', status: 'ACTIVE' });

    expect(result).toEqual({
      error: true,
      message: 'something went wrong ',
    });
  });
});
