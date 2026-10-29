const { Op } = require('sequelize');
const { countVerificationRecordsThisMonth } = require('../../nupayVerificationRecord');
const nupayVerificationRecord = require('../../../entities/nupayVerificationRecord');

jest.mock('../../../entities/nupayVerificationRecord');
jest.mock('../../../entities/credential');

describe('countVerificationRecordsThisMonth', () => {
  const from = new Date('2026-07-01T00:00:00.000Z');
  const to = new Date('2026-07-31T23:59:59.999Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should count total/valid/invalid/pending within the given window, scoped to corporateUserId', async () => {
    nupayVerificationRecord.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(6)  // VALID
      .mockResolvedValueOnce(3)  // INVALID
      .mockResolvedValueOnce(1); // PENDING
    nupayVerificationRecord.findOne.mockResolvedValue({ createdAt: new Date('2026-07-16T10:40:20.000Z') });

    const result = await countVerificationRecordsThisMonth({ corporateUserId: 763, from, to });

    expect(nupayVerificationRecord.count).toHaveBeenCalledTimes(4);

    const dateWhere = { corporateUserId: 763, createdAt: { [Op.between]: [from, to] } };
    expect(nupayVerificationRecord.count).toHaveBeenNthCalledWith(1, { where: dateWhere });
    expect(nupayVerificationRecord.count).toHaveBeenNthCalledWith(2, { where: { ...dateWhere, status: 'VALID' } });
    expect(nupayVerificationRecord.count).toHaveBeenNthCalledWith(3, { where: { ...dateWhere, status: 'INVALID' } });
    expect(nupayVerificationRecord.count).toHaveBeenNthCalledWith(4, { where: { ...dateWhere, status: 'PENDING' } });

    expect(result).toEqual({
      count: 10,
      validCount: 6,
      invalidCount: 3,
      pendingCount: 1,
      lastVerificationAddedDate: new Date('2026-07-16T10:40:20.000Z'),
    });
  });

  it('should look up the last verification without a date-window restriction, sorted DESC', async () => {
    nupayVerificationRecord.count.mockResolvedValue(0);
    nupayVerificationRecord.findOne.mockResolvedValue(null);

    await countVerificationRecordsThisMonth({ corporateUserId: 763, from, to });

    expect(nupayVerificationRecord.findOne).toHaveBeenCalledWith({
      where: { corporateUserId: 763 },
      order: [['createdAt', 'DESC']],
      attributes: ['createdAt'],
    });
  });

  it('should return null lastVerificationAddedDate when no records exist at all', async () => {
    nupayVerificationRecord.count.mockResolvedValue(0);
    nupayVerificationRecord.findOne.mockResolvedValue(null);

    const result = await countVerificationRecordsThisMonth({ corporateUserId: 763, from, to });

    expect(result.lastVerificationAddedDate).toBeNull();
    expect(result).toEqual({ count: 0, validCount: 0, invalidCount: 0, pendingCount: 0, lastVerificationAddedDate: null });
  });

  it('should propagate errors from the database', async () => {
    nupayVerificationRecord.count.mockRejectedValue(new Error('DB Error'));
    nupayVerificationRecord.findOne.mockResolvedValue(null);

    await expect(
      countVerificationRecordsThisMonth({ corporateUserId: 763, from, to })
    ).rejects.toThrow('DB Error');
  });
});
