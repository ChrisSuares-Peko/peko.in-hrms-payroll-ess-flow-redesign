const PaytmBpos = require('../../../entities/paytmBpos');
const { Op } = require('sequelize');
const { findAllBposByCorporate } = require('../../paytmBpos');

jest.mock('../../../entities/paytmBpos', () => ({
  findAndCountAll: jest.fn(),
}));

describe('findAllBposByCorporate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch BPOS list with correct filters and defaults', async () => {
    const params = {
      corporateId: 10,
      limit: 10,
      offset: 0,
      sort: 'ASC',
      searchText: '',
    };

    const mockResponse = { rows: [], count: 0 };
    PaytmBpos.findAndCountAll.mockResolvedValue(mockResponse);

    const result = await findAllBposByCorporate(params);

    expect(PaytmBpos.findAndCountAll).toHaveBeenCalledWith({
      where: {
        credentialId: 10,
        [Op.or]: [
          { storeName: { [Op.like]: '%%' } },
          { businessCategory: { [Op.like]: '%%' } },
          { contactPerson: { [Op.like]: '%%' } },
          { mobileNumber: { [Op.like]: '%%' } },
        ],
      },
      order: [['createdAt', 'ASC']],
      limit: 10,
      offset: 0,
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResponse);
  });

  it('should apply searchText correctly', async () => {
    const params = {
      corporateId: 20,
      searchText: 'abc',
      sort: 'DESC',
      limit: 5,
      offset: 2,
    };

    PaytmBpos.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllBposByCorporate(params);

    expect(PaytmBpos.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          credentialId: 20,
          [Op.or]: [
            { storeName: { [Op.like]: '%abc%' } },
            { businessCategory: { [Op.like]: '%abc%' } },
            { contactPerson: { [Op.like]: '%abc%' } },
            { mobileNumber: { [Op.like]: '%abc%' } },
          ],
        }),
      })
    );
  });

  it('should use custom sorting column and order', async () => {
    const params = {
      corporateId: 30,
      column: 'storeName',
      sort: 'DESC',
      limit: 15,
      offset: 5,
      searchText: '',
    };

    PaytmBpos.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllBposByCorporate(params);

    expect(PaytmBpos.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: [['storeName', 'DESC']],
      })
    );
  });

  it('should throw if database fails', async () => {
    PaytmBpos.findAndCountAll.mockRejectedValue(new Error('DB Failure'));

    await expect(
      findAllBposByCorporate({
        corporateId: 12,
        limit: 5,
        offset: 0,
        sort: 'ASC',
      })
    ).rejects.toThrow('DB Failure');
  });

  it('should pass correct limit & offset', async () => {
    const params = {
      corporateId: 99,
      limit: 50,
      offset: 100,
      sort: 'ASC',
      searchText: '',
    };

    PaytmBpos.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllBposByCorporate(params);

    expect(PaytmBpos.findAndCountAll.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        limit: 50,
        offset: 100,
      })
    );
  });
});
