jest.mock('../../entities/setting', () => ({ findOne: jest.fn() }));

const setting = require('../../entities/setting');
const { isInternalAccount } = require('../setting');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('isInternalAccount', () => {
  it('is true when the credential is on the internalAccounts list', async () => {
    setting.findOne.mockResolvedValue({ id: 1, name: 'internalAccounts' });

    expect(await isInternalAccount(42)).toBe(true);
    const { where } = setting.findOne.mock.calls[0][0];
    expect(where.name).toBe('internalAccounts');
  });

  it('is false when it is not on the list', async () => {
    setting.findOne.mockResolvedValue(null);

    expect(await isInternalAccount('42')).toBe(false);
  });

  it('is false, without asking, for a missing or non-numeric credential id', async () => {
    for (const id of [undefined, null, 'abc', NaN]) expect(await isInternalAccount(id)).toBe(false);
    expect(setting.findOne).not.toHaveBeenCalled();
  });

  it('is false when the setting cannot be read, so the fee is never skipped by mistake', async () => {
    setting.findOne.mockRejectedValue(new Error('db down'));

    expect(await isInternalAccount(42)).toBe(false);
  });
});
