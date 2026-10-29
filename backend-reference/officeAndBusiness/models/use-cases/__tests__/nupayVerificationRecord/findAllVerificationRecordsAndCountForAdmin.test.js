const { Op } = require('sequelize');
const { findAllVerificationRecordsAndCountForAdmin } = require('../../nupayVerificationRecord');
const nupayVerificationRecord = require('../../../entities/nupayVerificationRecord');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/nupayVerificationRecord');
jest.mock('../../../entities/credential');

describe('findAllVerificationRecordsAndCountForAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should query across all corporates with no credentialId scoping', async () => {
    nupayVerificationRecord.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllVerificationRecordsAndCountForAdmin({ limit: 10, offset: 0 });

    const call = nupayVerificationRecord.findAndCountAll.mock.calls[0][0];
    expect(call.where.credentialId).toBeUndefined();
    expect(call.subQuery).toBe(false);
    expect(call.limit).toBe(10);
    expect(call.offset).toBe(0);
  });

  it('should include the credential model with the registeredByCredential self-join', async () => {
    nupayVerificationRecord.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllVerificationRecordsAndCountForAdmin({});

    const include = nupayVerificationRecord.findAndCountAll.mock.calls[0][0].include;
    const credentialInclude = include.find((i) => i.model === credential);
    expect(credentialInclude).toBeDefined();
    expect(credentialInclude.attributes).toEqual(['name', 'email', 'username']);
    expect(credentialInclude.include[0]).toEqual({
      model: credential,
      as: 'registeredByCredential',
      attributes: ['name'],
    });
  });

  it('should search across referenceNumber/transactionId/verificationType and joined credential fields', async () => {
    nupayVerificationRecord.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllVerificationRecordsAndCountForAdmin({ searchText: 'PAN' });

    const where = nupayVerificationRecord.findAndCountAll.mock.calls[0][0].where;
    expect(where[Op.or]).toEqual([
      { referenceNumber: { [Op.like]: '%pan%' } },
      { transactionId: { [Op.like]: '%pan%' } },
      { verificationType: { [Op.like]: '%pan%' } },
      { '$credential.name$': { [Op.like]: '%pan%' } },
      { '$credential.username$': { [Op.like]: '%pan%' } },
    ]);
  });

  it('should escape LIKE wildcard characters in searchText', async () => {
    nupayVerificationRecord.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllVerificationRecordsAndCountForAdmin({ searchText: '50%_off' });

    const where = nupayVerificationRecord.findAndCountAll.mock.calls[0][0].where;
    expect(where[Op.or][0].referenceNumber[Op.like]).toBe('%50\\%\\_off%');
  });

  it('should uppercase and apply the status filter when not ALL', async () => {
    nupayVerificationRecord.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllVerificationRecordsAndCountForAdmin({ status: 'valid' });

    const where = nupayVerificationRecord.findAndCountAll.mock.calls[0][0].where;
    expect(where.status).toBe('VALID');
  });

  it('should not apply a status filter when status is ALL', async () => {
    nupayVerificationRecord.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllVerificationRecordsAndCountForAdmin({ status: 'ALL' });

    const where = nupayVerificationRecord.findAndCountAll.mock.calls[0][0].where;
    expect(where.status).toBeUndefined();
  });

  it('should apply a date range filter (to inclusive of end-of-day)', async () => {
    nupayVerificationRecord.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllVerificationRecordsAndCountForAdmin({ from: '2026-01-01', to: '2026-01-10' });

    const where = nupayVerificationRecord.findAndCountAll.mock.calls[0][0].where;
    const [start, end] = where.createdAt[Op.between];
    expect(start).toEqual(new Date('2026-01-01'));
    expect(end.getDate()).toBe(11);
  });

  it('should filter by the joined credential.registeredBy when provided', async () => {
    nupayVerificationRecord.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllVerificationRecordsAndCountForAdmin({ registeredBy: 'partner-1' });

    const where = nupayVerificationRecord.findAndCountAll.mock.calls[0][0].where;
    expect(where['$credential.registeredBy$']).toBe('partner-1');
  });

  it('should sort by the given column/sort, defaulting to createdAt DESC', async () => {
    nupayVerificationRecord.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllVerificationRecordsAndCountForAdmin({});
    expect(nupayVerificationRecord.findAndCountAll.mock.calls[0][0].order).toEqual([['createdAt', 'DESC']]);

    jest.clearAllMocks();
    nupayVerificationRecord.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await findAllVerificationRecordsAndCountForAdmin({ column: 'status', sort: 'ASC' });
    expect(nupayVerificationRecord.findAndCountAll.mock.calls[0][0].order).toEqual([['status', 'ASC']]);
  });

  it('should return the rows/count from the database', async () => {
    const dbResult = { count: 3, rows: [{ id: 1 }, { id: 2 }, { id: 3 }] };
    nupayVerificationRecord.findAndCountAll.mockResolvedValue(dbResult);

    const result = await findAllVerificationRecordsAndCountForAdmin({});

    expect(result).toEqual(dbResult);
  });

  it('should propagate errors from the database', async () => {
    nupayVerificationRecord.findAndCountAll.mockRejectedValue(new Error('DB Error'));

    await expect(findAllVerificationRecordsAndCountForAdmin({})).rejects.toThrow('DB Error');
  });
});
