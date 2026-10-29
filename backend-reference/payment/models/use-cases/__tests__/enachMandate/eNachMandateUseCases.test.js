const EnachMandate = require('../../../entities/eNachMandate');
const { Op } = require('sequelize');

const {
  addEnachMandate,
  findEnachMandateByReferenceId,
  updateEnachMandateByReferenceId,
  findAllEnachMandates,
} = require('../../eNachMandate');

jest.mock('../../../entities/eNachMandate', () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findAndCountAll: jest.fn(),
  update: jest.fn(),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const makeParams = (overrides = {}) => ({
  customer_name: 'Alice',
  customer_phone: '9999999999',
  customer_email: 'alice@example.com',
  account_number: '123456789',
  account_type: 'SAVINGS',
  bank_code: 'HDFC',
  authentication_mode: 'NetBanking',
  amount: 1000,
  frequency: 'Monthly',
  start_date: '2024-01-01',
  end_date: '2025-01-01',
  amount_rule: 'fixed',
  category_code: 'LONS',
  reference_id: 'ENACH-REF-001',
  decentro_txn_id: 'DTX-001',
  decentro_mandate_id: 'MAND-001',
  status: 'PENDING',
  uistreams: null,
  corporateUser: 'user-1',
  mandate_link: 'https://mandate.example.com',
  ...overrides,
});

const makeMockMandate = (overrides = {}) => ({
  id: 1,
  ...makeParams(),
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// addEnachMandate
// ─────────────────────────────────────────────────────────────────────────────

describe('addEnachMandate', () => {
  it('creates a mandate with all provided fields', async () => {
    const params = makeParams();
    const mockMandate = makeMockMandate();
    EnachMandate.create.mockResolvedValue(mockMandate);

    const result = await addEnachMandate(params);

    expect(EnachMandate.create).toHaveBeenCalledTimes(1);
    const createArg = EnachMandate.create.mock.calls[0][0];
    expect(createArg.customer_name).toBe('Alice');
    expect(createArg.account_number).toBe('123456789');
    expect(createArg.corporateUser).toBe('user-1');
    expect(result).toEqual(mockMandate);
  });

  it('strips undefined fields before create', async () => {
    const params = makeParams({ customer_email: undefined, uistreams: undefined });
    EnachMandate.create.mockResolvedValue(makeMockMandate());

    await addEnachMandate(params);

    const createArg = EnachMandate.create.mock.calls[0][0];
    expect(createArg).not.toHaveProperty('customer_email');
    expect(createArg).not.toHaveProperty('uistreams');
  });

  it('throws on db error', async () => {
    EnachMandate.create.mockRejectedValue(new Error('DB create failed'));

    await expect(addEnachMandate(makeParams())).rejects.toThrow('DB create failed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// findEnachMandateByReferenceId
// ─────────────────────────────────────────────────────────────────────────────

describe('findEnachMandateByReferenceId', () => {
  it('returns the mandate when found', async () => {
    const mandate = makeMockMandate();
    EnachMandate.findOne.mockResolvedValue(mandate);

    const result = await findEnachMandateByReferenceId('ENACH-REF-001');

    expect(EnachMandate.findOne).toHaveBeenCalledWith({
      where: { reference_id: 'ENACH-REF-001' },
      raw: true,
    });
    expect(result).toEqual(mandate);
  });

  it('returns null when not found', async () => {
    EnachMandate.findOne.mockResolvedValue(null);

    const result = await findEnachMandateByReferenceId('ENACH-NOTFOUND');

    expect(result).toBeNull();
  });

  it('throws on db error', async () => {
    EnachMandate.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findEnachMandateByReferenceId('ENACH-REF-001')).rejects.toThrow('DB error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateEnachMandateByReferenceId
// ─────────────────────────────────────────────────────────────────────────────

describe('updateEnachMandateByReferenceId', () => {
  it('updates the mandate and returns updatedCount', async () => {
    EnachMandate.update.mockResolvedValue([1]);

    const result = await updateEnachMandateByReferenceId('ENACH-REF-001', { status: 'ACTIVE' });

    expect(EnachMandate.update).toHaveBeenCalledWith(
      { status: 'ACTIVE' },
      { where: { reference_id: 'ENACH-REF-001' } }
    );
    expect(result).toBe(1);
  });

  it('returns 0 when no record found to update', async () => {
    EnachMandate.update.mockResolvedValue([0]);

    const result = await updateEnachMandateByReferenceId('ENACH-NONE', { status: 'ACTIVE' });

    expect(result).toBe(0);
  });

  it('can update multiple fields at once', async () => {
    EnachMandate.update.mockResolvedValue([1]);

    await updateEnachMandateByReferenceId('ENACH-REF-001', {
      status: 'REGISTERED',
      decentro_mandate_id: 'NEW-MAND-001',
    });

    const updateArg = EnachMandate.update.mock.calls[0][0];
    expect(updateArg.status).toBe('REGISTERED');
    expect(updateArg.decentro_mandate_id).toBe('NEW-MAND-001');
  });

  it('throws on db error', async () => {
    EnachMandate.update.mockRejectedValue(new Error('Update failed'));

    await expect(
      updateEnachMandateByReferenceId('ENACH-REF-001', { status: 'ACTIVE' })
    ).rejects.toThrow('Update failed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// findAllEnachMandates
// ─────────────────────────────────────────────────────────────────────────────

describe('findAllEnachMandates', () => {
  it('returns count and rows for the user', async () => {
    const rows = [makeMockMandate()];
    EnachMandate.findAndCountAll.mockResolvedValue({ count: 1, rows });

    const result = await findAllEnachMandates({ corporateUser: 'user-1' });

    expect(result.count).toBe(1);
    expect(result.rows).toEqual(rows);

    const call = EnachMandate.findAndCountAll.mock.calls[0][0];
    expect(call.where.corporateUser).toBe('user-1');
    expect(call.order).toEqual([['createdAt', 'DESC']]);
    expect(call.raw).toBe(true);
  });

  it('applies default pagination (limit=10, page=0)', async () => {
    EnachMandate.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllEnachMandates({ corporateUser: 'user-1' });

    const call = EnachMandate.findAndCountAll.mock.calls[0][0];
    expect(call.limit).toBe(10);
    expect(call.offset).toBe(0);
  });

  it('applies custom limit and page', async () => {
    EnachMandate.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllEnachMandates({ corporateUser: 'user-1', limit: 20, page: 2 });

    const call = EnachMandate.findAndCountAll.mock.calls[0][0];
    expect(call.limit).toBe(20);
    expect(call.offset).toBe(40); // 20 * 2
  });

  it('applies status filter as uppercase', async () => {
    EnachMandate.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllEnachMandates({ corporateUser: 'user-1', status: 'active' });

    const where = EnachMandate.findAndCountAll.mock.calls[0][0].where;
    expect(where.status).toBe('ACTIVE');
  });

  it('applies search filter across name, phone, email, ref id, and txn id', async () => {
    EnachMandate.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllEnachMandates({ corporateUser: 'user-1', search: 'alice' });

    const where = EnachMandate.findAndCountAll.mock.calls[0][0].where;
    const orClause = where[Op.or];
    expect(Array.isArray(orClause)).toBe(true);
    const fields = orClause.map(c => Object.keys(c)[0]);
    expect(fields).toContain('reference_id');
    expect(fields).toContain('customer_name');
    expect(fields).toContain('customer_phone');
    expect(fields).toContain('customer_email');
    expect(fields).toContain('decentro_txn_id');
  });

  it('returns empty result when no mandates exist', async () => {
    EnachMandate.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await findAllEnachMandates({ corporateUser: 'user-1' });

    expect(result.count).toBe(0);
    expect(result.rows).toHaveLength(0);
  });

  it('throws on db error', async () => {
    EnachMandate.findAndCountAll.mockRejectedValue(new Error('Query failed'));

    await expect(findAllEnachMandates({ corporateUser: 'user-1' })).rejects.toThrow('Query failed');
  });
});
