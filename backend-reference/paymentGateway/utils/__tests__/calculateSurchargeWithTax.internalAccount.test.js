jest.mock('../../models/use-cases/serviceOperator', () => ({ findOne: jest.fn() }));
jest.mock('../../models/use-cases/disableService', () => ({ findOne: jest.fn() }));
jest.mock('../../models/use-cases/cashback', () => ({ findOne: jest.fn() }));
jest.mock('../../models/use-cases/subscription', () => ({ findAllActiveSubscriptions: jest.fn() }));
jest.mock('../../models/use-cases/setting', () => ({ getGstDetails: jest.fn(), isInternalAccount: jest.fn() }));
jest.mock('../../models/entities/serviceOperator', () => ({}));
jest.mock('../../models/entities/vendor', () => ({}));
jest.mock('../loggerHelper', () => ({ customLog: jest.fn() }));

const { getGstDetails, isInternalAccount } = require('../../models/use-cases/setting');
const { calculateSurcharge, calculateSurchargeWithTax } = require('../checkAndFetchServiceDetails');

beforeEach(() => {
  jest.clearAllMocks();
  getGstDetails.mockResolvedValue({ details: { gst: 18 } });
  isInternalAccount.mockResolvedValue(false);
});

describe('calculateSurcharge', () => {
  it('returns the plain surcharge, without any internal check, when no user id is passed', async () => {
    expect(await calculateSurcharge(5, 'FLAT', 1000, null, 3)).toBe(15);
    expect(isInternalAccount).not.toHaveBeenCalled();
  });

  it('returns 0 for an internal account and the plain surcharge for anyone else', async () => {
    isInternalAccount.mockResolvedValueOnce(true);

    expect(await calculateSurcharge(2, 'PERCENTAGE', 5000, 42)).toBe(0);
    expect(await calculateSurcharge(2, 'PERCENTAGE', 5000, 7)).toBe(100);
    expect(isInternalAccount).toHaveBeenNthCalledWith(1, 42);
    expect(isInternalAccount).toHaveBeenNthCalledWith(2, 7);
  });
});

describe('calculateSurchargeWithTax', () => {
  it('works out the surcharge and its GST as before when no user id is passed, without any internal check', async () => {
    expect(await calculateSurchargeWithTax(5, 'FLAT', 1000)).toEqual({ surchargeWithoutTax: 5, surcharge: 5.9 });
    expect(await calculateSurchargeWithTax(2, 'PERCENTAGE', 1000)).toEqual({ surchargeWithoutTax: 20, surcharge: 23.6 });
    expect(isInternalAccount).not.toHaveBeenCalled();
  });

  it('charges an ordinary account the same surcharge when its user id is passed', async () => {
    expect(await calculateSurchargeWithTax(5, 'FLAT', 1000, 42, 2)).toEqual({ surchargeWithoutTax: 10, surcharge: 11.8 });
    expect(isInternalAccount).toHaveBeenCalledWith(42);
  });

  it('charges an internal account nothing, whatever the type, amount or quantity', async () => {
    isInternalAccount.mockResolvedValue(true);

    expect(await calculateSurchargeWithTax(5, 'FLAT', 1000, 42, 3)).toEqual({ surchargeWithoutTax: 0, surcharge: 0 });
    expect(await calculateSurchargeWithTax(2, 'PERCENTAGE', 5000, 42)).toEqual({ surchargeWithoutTax: 0, surcharge: 0 });
    expect(getGstDetails).not.toHaveBeenCalled();
  });

  it('does not exempt anyone from a call that carries no user id, even if they are internal', async () => {
    isInternalAccount.mockResolvedValue(true);

    expect(await calculateSurchargeWithTax(5, 'FLAT', 1000)).toEqual({ surchargeWithoutTax: 5, surcharge: 5.9 });
  });
});
