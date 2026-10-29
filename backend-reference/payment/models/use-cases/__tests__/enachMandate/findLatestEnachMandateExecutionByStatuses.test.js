const EnachMandateExecution = require('../../../entities/eNachMandateExecution');
const { Op } = require('sequelize');
const { findLatestEnachMandateExecutionByStatuses } = require('../../eNachMandateExecution');

jest.mock('../../../entities/eNachMandateExecution', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../../utils/paymentLinks', () => ({
  ENACH_EXECUTION_TERMINAL_STATUSES: new Set(['SUCCESS', 'FAILED', 'CANCELLED', 'REJECTED']),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('findLatestEnachMandateExecutionByStatuses', () => {
  it('returns the latest execution matching any of the given statuses', async () => {
    const execution = { id: 5, status: 'SUCCESS', mandate_reference_id: 'ENACH-REF-001' };
    EnachMandateExecution.findOne.mockResolvedValue(execution);

    const result = await findLatestEnachMandateExecutionByStatuses({
      mandate_reference_id: 'ENACH-REF-001',
      corporateUser: 'user-1',
      statuses: ['SUCCESS', 'FAILED'],
    });

    expect(EnachMandateExecution.findOne).toHaveBeenCalledWith({
      where: {
        mandate_reference_id: 'ENACH-REF-001',
        corporateUser: 'user-1',
        status: { [Op.in]: ['SUCCESS', 'FAILED'] },
      },
      order: [['createdAt', 'DESC']],
      raw: true,
    });
    expect(result).toEqual(execution);
  });

  it('returns null without querying when statuses is an empty array', async () => {
    const result = await findLatestEnachMandateExecutionByStatuses({
      mandate_reference_id: 'ENACH-REF-001',
      corporateUser: 'user-1',
      statuses: [],
    });

    expect(EnachMandateExecution.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('returns null without querying when statuses is not an array', async () => {
    const result = await findLatestEnachMandateExecutionByStatuses({
      mandate_reference_id: 'ENACH-REF-001',
      corporateUser: 'user-1',
      statuses: 'SUCCESS',
    });

    expect(EnachMandateExecution.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('returns null when no matching execution is found', async () => {
    EnachMandateExecution.findOne.mockResolvedValue(null);

    const result = await findLatestEnachMandateExecutionByStatuses({
      mandate_reference_id: 'ENACH-REF-001',
      corporateUser: 'user-1',
      statuses: ['SUCCESS'],
    });

    expect(result).toBeNull();
  });

  it('queries with raw: true and orders by createdAt DESC', async () => {
    EnachMandateExecution.findOne.mockResolvedValue(null);

    await findLatestEnachMandateExecutionByStatuses({
      mandate_reference_id: 'ENACH-REF-001',
      corporateUser: 'user-1',
      statuses: ['PENDING'],
    });

    const call = EnachMandateExecution.findOne.mock.calls[0][0];
    expect(call.order).toEqual([['createdAt', 'DESC']]);
    expect(call.raw).toBe(true);
  });

  it('throws on db error', async () => {
    EnachMandateExecution.findOne.mockRejectedValue(new Error('DB error'));

    await expect(
      findLatestEnachMandateExecutionByStatuses({
        mandate_reference_id: 'ENACH-REF-001',
        corporateUser: 'user-1',
        statuses: ['SUCCESS'],
      })
    ).rejects.toThrow('DB error');
  });
});
