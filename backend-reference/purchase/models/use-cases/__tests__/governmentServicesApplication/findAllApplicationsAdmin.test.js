const { Op } = require('sequelize');
const governmentServicesApplication = require('../../../entities/governmentServicesApplication');
const credential = require('../../../entities/credential');
const { findAllApplicationsAdmin } = require('../../governmentServicesApplication');

jest.mock('../../../entities/governmentServicesApplication', () => ({
  findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/credential', () => ({}));

describe('governmentServicesApplication findAllApplicationsAdmin use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    governmentServicesApplication.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
  });

  const lastQuery = () => governmentServicesApplication.findAndCountAll.mock.calls[0][0];

  it('should apply defaults and exclude JSON columns', async () => {
    const result = await findAllApplicationsAdmin();

    const query = lastQuery();
    expect(query).toMatchObject({
      where: {},
      offset: 0,
      limit: 20,
      order: [['createdAt', 'DESC']],
      subQuery: false,
      include: [{ model: credential, as: 'credential', attributes: ['id', 'username', 'name'], required: false }],
    });
    expect(query.attributes).not.toContain('applicationData');
    expect(query.attributes).not.toContain('documents');
    expect(result).toEqual({ rows: [], count: 0 });
  });

  it('should apply status, paymentStatus, corporate and date filters', async () => {
    await findAllApplicationsAdmin({
      status: 'SUBMITTED',
      paymentStatus: 'SUCCESS',
      corporateId: 7,
      from: '2026-09-01',
      to: '2026-09-30',
    });

    expect(lastQuery().where).toEqual({
      status: 'SUBMITTED',
      paymentStatus: 'SUCCESS',
      credentialId: 7,
      createdAt: { [Op.between]: [new Date('2026-09-01'), new Date('2026-09-30T23:59:59')] },
    });
  });

  it('should ignore a date range unless both from and to are given', async () => {
    await findAllApplicationsAdmin({ from: '2026-09-01' });

    expect(lastQuery().where).not.toHaveProperty('createdAt');
  });

  it('should search across application id, business name and credential', async () => {
    await findAllApplicationsAdmin({ searchText: 'acme' });

    expect(lastQuery().where[Op.or]).toEqual([
      { applicationId: { [Op.like]: '%acme%' } },
      { legalBusinessName: { [Op.like]: '%acme%' } },
      { '$credential.username$': { [Op.like]: '%acme%' } },
      { '$credential.name$': { [Op.like]: '%acme%' } },
    ]);
  });

  it('should honour a whitelisted sort field and ASC direction', async () => {
    await findAllApplicationsAdmin({ sortField: 'amount', sort: 'ASC' });

    expect(lastQuery().order).toEqual([['amount', 'ASC']]);
  });

  it('should fall back to createdAt DESC for an unknown sort field or direction', async () => {
    await findAllApplicationsAdmin({ sortField: 'applicationData', sort: 'sideways' });

    expect(lastQuery().order).toEqual([['createdAt', 'DESC']]);
  });

  it('should throw an error when database query fails', async () => {
    governmentServicesApplication.findAndCountAll.mockRejectedValue(new Error('DB error'));

    await expect(findAllApplicationsAdmin()).rejects.toThrow('DB error');
  });
});
