const { Op } = require('sequelize');
const { findAllVerificationRecordsAndCount } = require('../../nupayVerificationRecord');
const nupayVerificationRecord = require('../../../entities/nupayVerificationRecord');

jest.mock('../../../entities/nupayVerificationRecord');
jest.mock('../../../entities/credential');

describe('findAllVerificationRecordsAndCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should scope the query to credentialId with default pagination/status/sort', async () => {
    nupayVerificationRecord.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllVerificationRecordsAndCount({ credentialId: 10 });

    expect(nupayVerificationRecord.findAndCountAll).toHaveBeenCalledWith({
      where: { credentialId: 10 },
      order: [['createdAt', 'DESC']],
      limit: 10,
      offset: 0,
    });
  });

  it('should apply a specific status filter when not ALL', async () => {
    nupayVerificationRecord.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllVerificationRecordsAndCount({ credentialId: 10, status: 'VALID' });

    const where = nupayVerificationRecord.findAndCountAll.mock.calls[0][0].where;
    expect(where.status).toBe('VALID');
  });

  it('should not apply a status filter when status is ALL', async () => {
    nupayVerificationRecord.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllVerificationRecordsAndCount({ credentialId: 10, status: 'ALL' });

    const where = nupayVerificationRecord.findAndCountAll.mock.calls[0][0].where;
    expect(where.status).toBeUndefined();
  });

  it('should apply a searchText OR filter across verificationType/referenceNumber/transactionId', async () => {
    nupayVerificationRecord.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllVerificationRecordsAndCount({ credentialId: 10, searchText: 'PAN' });

    const where = nupayVerificationRecord.findAndCountAll.mock.calls[0][0].where;
    expect(where[Op.or]).toEqual([
      { verificationType: { [Op.like]: '%PAN%' } },
      { referenceNumber: { [Op.like]: '%PAN%' } },
      { transactionId: { [Op.like]: '%PAN%' } },
    ]);
  });

  it('should apply a date range filter (to inclusive of end-of-day) when from/to are provided', async () => {
    nupayVerificationRecord.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllVerificationRecordsAndCount({ credentialId: 10, from: '2026-01-01', to: '2026-01-10' });

    const where = nupayVerificationRecord.findAndCountAll.mock.calls[0][0].where;
    const [start, end] = where.createdAt[Op.between];
    expect(start).toEqual(new Date('2026-01-01'));
    expect(end.getDate()).toBe(11);
    expect(end.getHours()).toBe(0);
  });

  it('should apply custom pagination (page/itemsPerPage) as limit/offset', async () => {
    nupayVerificationRecord.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllVerificationRecordsAndCount({ credentialId: 10, page: 3, itemsPerPage: 5 });

    const call = nupayVerificationRecord.findAndCountAll.mock.calls[0][0];
    expect(call.limit).toBe(5);
    expect(call.offset).toBe(10);
  });

  it('should apply custom sort/sortField', async () => {
    nupayVerificationRecord.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllVerificationRecordsAndCount({ credentialId: 10, sort: 'ASC', sortField: 'status' });

    const call = nupayVerificationRecord.findAndCountAll.mock.calls[0][0];
    expect(call.order).toEqual([['status', 'ASC']]);
  });

  it('should return the rows/count from the database', async () => {
    const dbResult = { count: 2, rows: [{ id: 1 }, { id: 2 }] };
    nupayVerificationRecord.findAndCountAll.mockResolvedValue(dbResult);

    const result = await findAllVerificationRecordsAndCount({ credentialId: 10 });

    expect(result).toEqual(dbResult);
  });

  it('should propagate errors from the database', async () => {
    nupayVerificationRecord.findAndCountAll.mockRejectedValue(new Error('DB Error'));

    await expect(findAllVerificationRecordsAndCount({ credentialId: 10 })).rejects.toThrow('DB Error');
  });
});
