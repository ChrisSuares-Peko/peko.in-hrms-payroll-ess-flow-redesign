const payoutBeneficiary = require('../../../entities/payoutBeneficiary');
const payoutTransaction = require('../../../entities/payoutTransaction');
const { findAll } = require('../../payoutBeneficiary');

jest.mock('../../../entities/payoutBeneficiary', () => ({ findAll: jest.fn() }));
jest.mock('../../../entities/payoutTransaction', () => ({ findAll: jest.fn() }));

const makeBeneficiary = (id) => ({ toJSON: () => ({ id, name: 'Test' }) });

describe('findAll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return beneficiaries merged with transaction stats', async () => {
    payoutBeneficiary.findAll.mockResolvedValue([makeBeneficiary(1)]);
    payoutTransaction.findAll.mockResolvedValue([
      { payoutBeneficiaryId: 1, totalPaid: '5000', lastPaymentDate: '2026-04-01' },
    ]);

    const result = await findAll({ credentialId: 1 });

    expect(result[0].totalPaid).toBe('5000');
    expect(result[0].lastPaymentDate).toBe('2026-04-01');
  });

  it('should set totalPaid to 0 when no stats exist for a beneficiary', async () => {
    payoutBeneficiary.findAll.mockResolvedValue([makeBeneficiary(99)]);
    payoutTransaction.findAll.mockResolvedValue([]);

    const result = await findAll({ credentialId: 1 });

    expect(result[0].totalPaid).toBe(0);
    expect(result[0].lastPaymentDate).toBeNull();
  });

  it('should filter by status when provided', async () => {
    payoutBeneficiary.findAll.mockResolvedValue([]);
    payoutTransaction.findAll.mockResolvedValue([]);

    await findAll({ credentialId: 1, status: 'ACTIVE' });

    const where = payoutBeneficiary.findAll.mock.calls[0][0].where;
    expect(where.status).toBe('ACTIVE');
  });

 
});
