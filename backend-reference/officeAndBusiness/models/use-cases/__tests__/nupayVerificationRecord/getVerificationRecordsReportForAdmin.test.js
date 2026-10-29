const { Op } = require('sequelize');
const { getVerificationRecordsReportForAdmin } = require('../../nupayVerificationRecord');
const nupayVerificationRecord = require('../../../entities/nupayVerificationRecord');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/nupayVerificationRecord');
jest.mock('../../../entities/credential');

describe('getVerificationRecordsReportForAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should query with no credentialId scoping and include the credential + registeredByCredential join', async () => {
    nupayVerificationRecord.findAll.mockResolvedValue([]);

    await getVerificationRecordsReportForAdmin({});

    const call = nupayVerificationRecord.findAll.mock.calls[0][0];
    expect(call.where.credentialId).toBeUndefined();
    expect(call.subQuery).toBe(false);
    const credentialInclude = call.include.find((i) => i.model === credential);
    expect(credentialInclude.attributes).toEqual(['name', 'username']);
    expect(credentialInclude.include[0]).toEqual({
      model: credential,
      as: 'registeredByCredential',
      attributes: ['name'],
    });
  });

  it('should search across referenceNumber/transactionId/verificationType and joined credential fields', async () => {
    nupayVerificationRecord.findAll.mockResolvedValue([]);

    await getVerificationRecordsReportForAdmin({ searchText: 'PAN' });

    const where = nupayVerificationRecord.findAll.mock.calls[0][0].where;
    expect(where[Op.or]).toEqual([
      { referenceNumber: { [Op.like]: '%pan%' } },
      { transactionId: { [Op.like]: '%pan%' } },
      { verificationType: { [Op.like]: '%pan%' } },
      { '$credential.name$': { [Op.like]: '%pan%' } },
      { '$credential.username$': { [Op.like]: '%pan%' } },
    ]);
  });

  it('should uppercase and apply a status filter when not ALL', async () => {
    nupayVerificationRecord.findAll.mockResolvedValue([]);

    await getVerificationRecordsReportForAdmin({ status: 'invalid' });

    expect(nupayVerificationRecord.findAll.mock.calls[0][0].where.status).toBe('INVALID');
  });

  it('should apply a date range filter (to inclusive of end-of-day)', async () => {
    nupayVerificationRecord.findAll.mockResolvedValue([]);

    await getVerificationRecordsReportForAdmin({ from: '2026-01-01', to: '2026-01-10' });

    const [start, end] = nupayVerificationRecord.findAll.mock.calls[0][0].where.createdAt[Op.between];
    expect(start).toEqual(new Date('2026-01-01'));
    expect(end.getDate()).toBe(11);
  });

  it('should filter by joined credential.registeredBy when provided', async () => {
    nupayVerificationRecord.findAll.mockResolvedValue([]);

    await getVerificationRecordsReportForAdmin({ registeredBy: 'partner-1' });

    expect(nupayVerificationRecord.findAll.mock.calls[0][0].where['$credential.registeredBy$']).toBe('partner-1');
  });

  it('should map a VALID row into the report row shape, formatting inputPayload and joined credential fields', async () => {
    const createdAt = new Date('2026-07-16T10:40:20.000Z');
    nupayVerificationRecord.findAll.mockResolvedValue([
      {
        createdAt,
        referenceNumber: 'ABC123',
        verificationType: 'PAN',
        status: 'VALID',
        inputPayload: { pan: 'ABCPV1234D', phone: '9999999999' },
        credential: { username: 'corp1', name: 'Acme Corp', registeredByCredential: { name: 'Partner One' } },
      },
    ]);

    const result = await getVerificationRecordsReportForAdmin({});

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      'Transaction Date': expect.any(String),
      'Transaction ID': 'ABC123',
      'Corporate ID': 'corp1',
      'Corporate Name': 'Acme Corp',
      'Partner Name': 'Partner One',
      'Verification Type': 'PAN',
      'Input Details': 'PAN: ABCPV1234D, Mobile Number: 9999999999',
      Result: 'VALID',
      Amount: '₹ 0.00',
      Status: 'VALID',
    });
  });

  it('should map an INVALID row Result/Status accordingly', async () => {
    nupayVerificationRecord.findAll.mockResolvedValue([
      {
        createdAt: new Date(),
        referenceNumber: 'XYZ999',
        verificationType: 'GSTIN',
        status: 'INVALID',
        inputPayload: {},
        credential: null,
      },
    ]);

    const result = await getVerificationRecordsReportForAdmin({});

    expect(result[0].Result).toBe('INVALID');
    expect(result[0].Status).toBe('INVALID');
  });

  it('should map a PENDING row Result to INVALID (only VALID status maps to VALID)', async () => {
    nupayVerificationRecord.findAll.mockResolvedValue([
      { createdAt: new Date(), referenceNumber: 'PEND1', verificationType: 'Aadhaar OKYC', status: 'PENDING', inputPayload: {}, credential: null },
    ]);

    const result = await getVerificationRecordsReportForAdmin({});

    expect(result[0].Result).toBe('INVALID');
    expect(result[0].Status).toBe('PENDING');
  });

  it('should fall back to "Not Available" when credential/fields are missing', async () => {
    nupayVerificationRecord.findAll.mockResolvedValue([
      { createdAt: null, referenceNumber: null, verificationType: null, status: 'INVALID', inputPayload: null, credential: undefined },
    ]);

    const result = await getVerificationRecordsReportForAdmin({});

    expect(result[0]).toEqual(expect.objectContaining({
      'Transaction Date': 'Not Available',
      'Transaction ID': 'Not Available',
      'Corporate ID': 'Not Available',
      'Corporate Name': 'Not Available',
      'Partner Name': 'Not Available',
      'Verification Type': 'Not Available',
      'Input Details': 'Not Available',
    }));
  });

  it('should propagate errors from the database', async () => {
    nupayVerificationRecord.findAll.mockRejectedValue(new Error('DB Error'));

    await expect(getVerificationRecordsReportForAdmin({})).rejects.toThrow('DB Error');
  });
});
