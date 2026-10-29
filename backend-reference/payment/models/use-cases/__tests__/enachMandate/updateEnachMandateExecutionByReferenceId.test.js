const EnachMandateExecution = require('../../../entities/eNachMandateExecution');
const { updateEnachMandateExecutionByReferenceId } = require('../../eNachMandateExecution');

jest.mock('../../../entities/eNachMandateExecution', () => ({
  update: jest.fn(),
}));

jest.mock('../../../../utils/paymentLinks', () => ({
  ENACH_EXECUTION_TERMINAL_STATUSES: new Set(['SUCCESS', 'FAILED', 'CANCELLED', 'REJECTED']),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('updateEnachMandateExecutionByReferenceId', () => {
  it('updates and returns updatedCount', async () => {
    EnachMandateExecution.update.mockResolvedValue([1]);

    const result = await updateEnachMandateExecutionByReferenceId('EXEC-REF-001', { status: 'SUCCESS' });

    expect(EnachMandateExecution.update).toHaveBeenCalledWith(
      { status: 'SUCCESS' },
      { where: { execution_reference_id: 'EXEC-REF-001' } }
    );
    expect(result).toBe(1);
  });

  it('returns 0 when no execution matches', async () => {
    EnachMandateExecution.update.mockResolvedValue([0]);

    const result = await updateEnachMandateExecutionByReferenceId('EXEC-NONE', { status: 'FAILED' });

    expect(result).toBe(0);
  });

  it('can update multiple fields in a single call', async () => {
    EnachMandateExecution.update.mockResolvedValue([1]);

    await updateEnachMandateExecutionByReferenceId('EXEC-REF-001', {
      status: 'SUCCESS',
      decentro_txn_id: 'DTX-002',
      processed_or_failed_at: new Date(),
    });

    const updateArg = EnachMandateExecution.update.mock.calls[0][0];
    expect(updateArg.status).toBe('SUCCESS');
    expect(updateArg.decentro_txn_id).toBe('DTX-002');
    expect(updateArg.processed_or_failed_at).toBeDefined();
  });

  it('throws on db error', async () => {
    EnachMandateExecution.update.mockRejectedValue(new Error('Update failed'));

    await expect(
      updateEnachMandateExecutionByReferenceId('EXEC-REF-001', { status: 'SUCCESS' })
    ).rejects.toThrow('Update failed');
  });
});
