const EnachMandate = require('../../../entities/eNachMandate');
const { Op } = require('sequelize');
const { findAllEnachMandates } = require('../../eNachMandate');

jest.mock('../../../entities/eNachMandate', () => ({
  findAndCountAll: jest.fn(),
}));

const makeMockMandate = (overrides = {}) => ({
  id: 1,
  reference_id: 'ENACH-REF-001',
  customer_name: 'Alice',
  corporateUser: 'user-1',
  status: 'PENDING',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('findAllEnachMandates', () => {
  it('returns count and rows for the given user', async () => {
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

  it('applies default pagination (limit=10, offset=0)', async () => {
    EnachMandate.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllEnachMandates({ corporateUser: 'user-1' });

    const call = EnachMandate.findAndCountAll.mock.calls[0][0];
    expect(call.limit).toBe(10);
    expect(call.offset).toBe(0);
  });

  it('applies custom limit and page (offset = limit * page)', async () => {
    EnachMandate.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllEnachMandates({ corporateUser: 'user-1', limit: 20, page: 2 });

    const call = EnachMandate.findAndCountAll.mock.calls[0][0];
    expect(call.limit).toBe(20);
    expect(call.offset).toBe(40);
  });

  it('applies status filter as uppercase', async () => {
    EnachMandate.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllEnachMandates({ corporateUser: 'user-1', status: 'active' });

    const where = EnachMandate.findAndCountAll.mock.calls[0][0].where;
    expect(where.status).toBe('ACTIVE');
  });

  it('does not add status to where clause when not provided', async () => {
    EnachMandate.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllEnachMandates({ corporateUser: 'user-1' });

    const where = EnachMandate.findAndCountAll.mock.calls[0][0].where;
    expect(where).not.toHaveProperty('status');
  });

  it('applies search filter across all relevant fields', async () => {
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
