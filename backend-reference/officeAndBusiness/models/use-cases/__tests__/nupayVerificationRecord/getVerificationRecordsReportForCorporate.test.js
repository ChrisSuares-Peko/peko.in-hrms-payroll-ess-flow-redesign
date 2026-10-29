const { Op } = require('sequelize');
const { getVerificationRecordsReportForCorporate } = require('../../nupayVerificationRecord');
const nupayVerificationRecord = require('../../../entities/nupayVerificationRecord');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/nupayVerificationRecord');
jest.mock('../../../entities/credential');

describe('getVerificationRecordsReportForCorporate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should scope the query to the given credentialId', async () => {
    nupayVerificationRecord.findAll.mockResolvedValue([]);

    await getVerificationRecordsReportForCorporate({ credentialId: 10 });

    const call = nupayVerificationRecord.findAll.mock.calls[0][0];
    expect(call.where.credentialId).toBe(10);
    expect(call.subQuery).toBe(false);
  });

  it('should include the credential + registeredByCredential join', async () => {
    nupayVerificationRecord.findAll.mockResolvedValue([]);

    await getVerificationRecordsReportForCorporate({ credentialId: 10 });

    const credentialInclude = nupayVerificationRecord.findAll.mock.calls[0][0].include.find((i) => i.model === credential);
    expect(credentialInclude.attributes).toEqual(['name', 'username']);
    expect(credentialInclude.include[0]).toEqual({
      model: credential,
      as: 'registeredByCredential',
      attributes: ['name'],
    });
  });

  it('should search only across referenceNumber/transactionId/verificationType (no credential fields)', async () => {
    nupayVerificationRecord.findAll.mockResolvedValue([]);

    await getVerificationRecordsReportForCorporate({ credentialId: 10, searchText: 'PAN' });

    const where = nupayVerificationRecord.findAll.mock.calls[0][0].where;
    expect(where[Op.or]).toEqual([
      { referenceNumber: { [Op.like]: '%pan%' } },
      { transactionId: { [Op.like]: '%pan%' } },
      { verificationType: { [Op.like]: '%pan%' } },
    ]);
  });

  it('should uppercase and apply a status filter when not ALL', async () => {
    nupayVerificationRecord.findAll.mockResolvedValue([]);

    await getVerificationRecordsReportForCorporate({ credentialId: 10, status: 'valid' });

    expect(nupayVerificationRecord.findAll.mock.calls[0][0].where.status).toBe('VALID');
  });

  it('should apply a date range filter (to inclusive of end-of-day)', async () => {
    nupayVerificationRecord.findAll.mockResolvedValue([]);

    await getVerificationRecordsReportForCorporate({ credentialId: 10, from: '2026-01-01', to: '2026-01-10' });

    const [start, end] = nupayVerificationRecord.findAll.mock.calls[0][0].where.createdAt[Op.between];
    expect(start).toEqual(new Date('2026-01-01'));
    expect(end.getDate()).toBe(11);
  });

  it('should map a row into the report row shape', async () => {
    nupayVerificationRecord.findAll.mockResolvedValue([
      {
        createdAt: new Date('2026-07-16T10:40:20.000Z'),
        referenceNumber: 'ABC123',
        verificationType: 'GSTIN',
        status: 'VALID',
        inputPayload: { gstin: '29ABCDE1234F1Z5' },
        credential: { username: 'corp1', name: 'Acme Corp', registeredByCredential: { name: 'Partner One' } },
      },
    ]);

    const result = await getVerificationRecordsReportForCorporate({ credentialId: 10 });

    expect(result[0]).toEqual({
      'Transaction Date': expect.any(String),
      'Transaction ID': 'ABC123',
      'Corporate ID': 'corp1',
      'Corporate Name': 'Acme Corp',
      'Partner Name': 'Partner One',
      'Verification Type': 'GSTIN',
      // "gstin" isn't in formatServiceField's knownAcronyms list (only "GST" is) - falls through
      // to the generic underscore/capitalize transform instead of the acronym shortcut.
      'Input Details': 'Gstin: 29ABCDE1234F1Z5',
      Result: 'VALID',
      Amount: '₹ 0.00',
      Status: 'VALID',
    });
  });

  it('should propagate errors from the database', async () => {
    nupayVerificationRecord.findAll.mockRejectedValue(new Error('DB Error'));

    await expect(getVerificationRecordsReportForCorporate({ credentialId: 10 })).rejects.toThrow('DB Error');
  });
});
