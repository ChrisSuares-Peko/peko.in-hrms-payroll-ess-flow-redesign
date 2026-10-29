const { getPGChargeDetails } = require('../../setting');
const setting = require('../../../entities/setting');

jest.mock('../../../entities/setting', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));

describe('setting - getPGChargeDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return matching charge details by key', async () => {
    const mockResult = {
      id: 3,
      name: 'PG_Charges',
      details: [
        { key: 'card', charge: 2 },
        { key: 'upi', charge: 0 },
      ],
    };
    setting.findOne.mockResolvedValue(mockResult);

    const result = await getPGChargeDetails('card');

    expect(result).toEqual({ key: 'card', charge: 2 });
  });

  it('should return empty object when no matching key found', async () => {
    const mockResult = {
      id: 3,
      name: 'PG_Charges',
      details: [{ key: 'card', charge: 2 }],
    };
    setting.findOne.mockResolvedValue(mockResult);

    const result = await getPGChargeDetails('unknown');

    expect(result).toEqual({});
  });

  it('should return empty object when details is empty', async () => {
    setting.findOne.mockResolvedValue({ id: 3, name: 'PG_Charges', details: [] });

    const result = await getPGChargeDetails('card');

    expect(result).toEqual({});
  });

  it('should return empty object when no PG_Charges setting found', async () => {
    setting.findOne.mockResolvedValue(null);

    const result = await getPGChargeDetails('card');

    expect(result).toEqual({});
  });
});
