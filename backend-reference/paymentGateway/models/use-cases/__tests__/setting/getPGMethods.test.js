const { getPGMethods, createPGMethod, updatePGMethod } = require('../../setting');
const setting = require('../../../entities/setting');

jest.mock('../../../entities/setting', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  findOrCreate: jest.fn(),
}));

describe('setting - getPGMethods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return PG methods', async () => {
    const mockResult = { id: 1, name: 'PG_Methods', details: { isGatewayPaymentAvailable: true } };
    setting.findOne.mockResolvedValue(mockResult);

    const result = await getPGMethods();

    expect(setting.findOne).toHaveBeenCalledWith({ where: { name: 'PG_Methods' }, raw: true });
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    setting.findOne.mockResolvedValue(null);

    const result = await getPGMethods();

    expect(result).toBeNull();
  });
});

describe('setting - createPGMethod', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the existing-or-created single PG method setting (idempotent)', async () => {
    const mockResult = {
      id: 1,
      name: 'PG_Methods',
      details: {
        isGatewayPaymentAvailable: false,
        isWalletPaymentAvailable: false,
        isCorporateCardPaymentAvailable: false,
        isCouponApplicable: false,
      },
    };
    setting.findOrCreate.mockResolvedValue([mockResult, true]);

    const result = await createPGMethod();

    expect(setting.findOrCreate).toHaveBeenCalledWith({
      where: { name: 'PG_Methods' },
      defaults: {
        name: 'PG_Methods',
        details: {
          isGatewayPaymentAvailable: false,
          isWalletPaymentAvailable: false,
          isCorporateCardPaymentAvailable: false,
          isCouponApplicable: false,
        },
      },
    });
    expect(result).toEqual(mockResult);
  });
});

describe('setting - updatePGMethod', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should update existing PG method setting', async () => {
    const existingRecord = { details: { isGatewayPaymentAvailable: false, isWalletPaymentAvailable: false } };
    setting.findOne.mockResolvedValue(existingRecord);
    setting.update.mockResolvedValue([1]);

    const result = await updatePGMethod({ isGatewayPaymentAvailable: true });

    expect(result).toEqual({ isGatewayPaymentAvailable: true, isWalletPaymentAvailable: false });
  });

  it('should return error when PG_Methods not found', async () => {
    setting.findOne.mockResolvedValue(null);

    const result = await updatePGMethod({ isGatewayPaymentAvailable: true });

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('PG_Methods not found');
  });
});
