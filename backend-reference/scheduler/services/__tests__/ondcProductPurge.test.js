jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }));
jest.mock('../../utils/cacheDataMethods', () => ({
  incrValue: jest.fn().mockResolvedValue(1),
}));

const { Op } = require('sequelize');
const ondcProducts = require('../../models/entities/ondc_product_with_transactionId');
const { incrValue } = require('../../utils/cacheDataMethods');
const { triggerOndcOosProductDelete } = require('../ondcProductPurge');
const { customLog } = require('../../utils/loggerHelper');

const NOW = new Date('2026-09-04T18:30:00.000Z');
const STALE_BEFORE = new Date('2026-09-03T18:30:00.000Z');

const staleWhere = {
  source: 'OFFICE_SUPPLIES',
  updatedAt: { [Op.lt]: STALE_BEFORE },
};

const oosWhere = {
  availableQuantity: { [Op.lte]: 0 },
};

beforeEach(() => {
  jest.clearAllMocks();
  ondcProducts.destroy.mockResolvedValue(0);
  incrValue.mockResolvedValue(1);
});

describe('triggerOndcOosProductDelete', () => {
  it('deletes stale office-supply rows then qty<=0 rows and bumps the list cache', async () => {
    ondcProducts.destroy
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(5);

    const result = await triggerOndcOosProductDelete({ now: NOW });

    expect(result).toEqual({ deleted: 8, staleDeleted: 3, oosDeleted: 5 });
    expect(ondcProducts.destroy.mock.calls[0][0]).toEqual({
      where: staleWhere,
      limit: 1000,
    });
    expect(ondcProducts.destroy.mock.calls[1][0]).toEqual({
      where: oosWhere,
      limit: 1000,
    });
    expect(ondcProducts.destroy.mock.calls[1][0].where.source).toBeUndefined();
    expect(incrValue).toHaveBeenCalledTimes(1);
    expect(incrValue).toHaveBeenCalledWith('ondc:list:ver:*');
    expect(customLog).toHaveBeenCalledWith(
      null,
      'info',
      expect.objectContaining({
        message: 'ONDC product purge complete',
        deleted: 8,
        staleDeleted: 3,
        oosDeleted: 5,
      }),
      'VENDOR'
    );
  });

  it('does not destroy rows newer than 24 hours in the stale pass', async () => {
    await triggerOndcOosProductDelete({ now: NOW });

    const { where } = ondcProducts.destroy.mock.calls[0][0];
    expect(where.source).toBe('OFFICE_SUPPLIES');
    expect(where.updatedAt).toEqual({ [Op.lt]: STALE_BEFORE });
    expect(where.updatedAt[Op.lt].getTime()).toBe(NOW.getTime() - 24 * 60 * 60 * 1000);
  });

  it('does not bump Redis when nothing was deleted', async () => {
    await expect(triggerOndcOosProductDelete({ now: NOW })).resolves.toEqual({
      deleted: 0,
      staleDeleted: 0,
      oosDeleted: 0,
    });
    expect(incrValue).not.toHaveBeenCalled();
  });

  it('still finishes when the Redis bump fails', async () => {
    ondcProducts.destroy
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(2);
    incrValue.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(triggerOndcOosProductDelete({ now: NOW })).resolves.toEqual({
      deleted: 2,
      staleDeleted: 0,
      oosDeleted: 2,
    });
    expect(customLog).toHaveBeenCalledWith(
      null,
      'error',
      expect.objectContaining({ message: 'ONDC list cache bump failed' }),
      'VENDOR'
    );
  });

  it('deletes stale rows in batches until a short page, then runs the OOS pass', async () => {
    ondcProducts.destroy.mockReset();
    ondcProducts.destroy
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);

    await expect(triggerOndcOosProductDelete({ batchSize: 2, now: NOW })).resolves.toEqual({
      deleted: 8,
      staleDeleted: 5,
      oosDeleted: 3,
    });
    expect(ondcProducts.destroy).toHaveBeenCalledTimes(5);
    expect(ondcProducts.destroy).toHaveBeenNthCalledWith(1, { where: staleWhere, limit: 2 });
    expect(ondcProducts.destroy).toHaveBeenNthCalledWith(4, { where: oosWhere, limit: 2 });
    expect(incrValue).toHaveBeenCalledTimes(1);
  });
});
