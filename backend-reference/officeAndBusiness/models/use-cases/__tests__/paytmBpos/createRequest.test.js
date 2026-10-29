const PaytmBpos = require('../../../entities/paytmBpos');
const { createRequest } = require('../../paytmBpos');

jest.mock('../../../entities/paytmBpos', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

describe('createRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error if store already exists', async () => {
    const data = { storeName: 'MyStore', credentialId: 10 };

    PaytmBpos.findOne.mockResolvedValue({ id: 1 });

    const result = await createRequest(data);

    expect(PaytmBpos.findOne).toHaveBeenCalledWith({
      where: { storeName: 'MyStore', credentialId: 10 },
    });

    expect(result).toEqual({
      error: 'This store is already requested for Paytm BPOS',
    });
  });

  it('should create new record if no existing record', async () => {
    const data = { storeName: 'NewStore', credentialId: 20 };
    const createdRecord = { id: 99, ...data };

    PaytmBpos.findOne.mockResolvedValue(null);
    PaytmBpos.create.mockResolvedValue(createdRecord);

    const result = await createRequest(data);

    expect(PaytmBpos.findOne).toHaveBeenCalledWith({
      where: { storeName: 'NewStore', credentialId: 20 },
    });

    expect(PaytmBpos.create).toHaveBeenCalledWith(data);

    expect(result).toEqual(createdRecord);
  });

  it('should throw error if findOne fails', async () => {
    PaytmBpos.findOne.mockRejectedValue(new Error('DB Failed'));

    await expect(createRequest({ storeName: 'X', credentialId: 1 }))
      .rejects.toThrow('DB Failed');
  });

  it('should throw error if create fails', async () => {
    PaytmBpos.findOne.mockResolvedValue(null);
    PaytmBpos.create.mockRejectedValue(new Error('Create Failed'));

    await expect(createRequest({ storeName: 'Y', credentialId: 2 }))
      .rejects.toThrow('Create Failed');
  });

  it('should call findOne with correct structure', async () => {
    const data = { storeName: 'ABC', credentialId: 55 };
    PaytmBpos.findOne.mockResolvedValue(null);
    PaytmBpos.create.mockResolvedValue({});

    await createRequest(data);

    expect(PaytmBpos.findOne).toHaveBeenCalledTimes(1);
    expect(PaytmBpos.findOne.mock.calls[0][0]).toEqual({
      where: { storeName: 'ABC', credentialId: 55 },
    });
  });
});
