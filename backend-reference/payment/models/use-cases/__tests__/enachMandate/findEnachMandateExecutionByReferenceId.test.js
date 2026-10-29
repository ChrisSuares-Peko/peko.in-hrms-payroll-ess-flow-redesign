const EnachMandateExecution = require('../../../entities/eNachMandateExecution');
const { findEnachMandateExecutionByReferenceId } = require('../../eNachMandateExecution');

jest.mock('../../../entities/eNachMandateExecution', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../../utils/paymentLinks', () => ({
  ENACH_EXECUTION_TERMINAL_STATUSES: new Set(['SUCCESS', 'FAILED', 'CANCELLED', 'REJECTED']),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('findEnachMandateExecutionByReferenceId', () => {
  it('returns the execution when found', async () => {
    const execution = { id: 1, execution_reference_id: 'EXEC-REF-001', status: 'PENDING' };
    EnachMandateExecution.findOne.mockResolvedValue(execution);

    const result = await findEnachMandateExecutionByReferenceId('EXEC-REF-001');

    expect(EnachMandateExecution.findOne).toHaveBeenCalledWith({
      where: { execution_reference_id: 'EXEC-REF-001' },
    });
    expect(result).toEqual(execution);
  });

  it('returns null without querying when execution_reference_id is falsy', async () => {
    const result = await findEnachMandateExecutionByReferenceId(null);

    expect(EnachMandateExecution.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('returns null when execution_reference_id is undefined', async () => {
    const result = await findEnachMandateExecutionByReferenceId(undefined);

    expect(EnachMandateExecution.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('returns null when execution is not found', async () => {
    EnachMandateExecution.findOne.mockResolvedValue(null);

    const result = await findEnachMandateExecutionByReferenceId('EXEC-MISSING');

    expect(result).toBeNull();
  });

  it('throws on db error', async () => {
    EnachMandateExecution.findOne.mockRejectedValue(new Error('DB error'));

    await expect(
      findEnachMandateExecutionByReferenceId('EXEC-REF-001')
    ).rejects.toThrow('DB error');
  });
});
