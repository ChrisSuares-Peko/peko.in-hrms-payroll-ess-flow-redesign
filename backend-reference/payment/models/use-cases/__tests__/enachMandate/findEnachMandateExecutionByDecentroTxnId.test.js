const EnachMandateExecution = require('../../../entities/eNachMandateExecution');
const { findEnachMandateExecutionByDecentroTxnId } = require('../../eNachMandateExecution');

jest.mock('../../../entities/eNachMandateExecution', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../../utils/paymentLinks', () => ({
  ENACH_EXECUTION_TERMINAL_STATUSES: new Set(['SUCCESS', 'FAILED', 'CANCELLED', 'REJECTED']),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('findEnachMandateExecutionByDecentroTxnId', () => {
  it('returns the execution when found', async () => {
    const execution = { id: 1, decentro_txn_id: 'DTX-001', status: 'PENDING' };
    EnachMandateExecution.findOne.mockResolvedValue(execution);

    const result = await findEnachMandateExecutionByDecentroTxnId('DTX-001');

    expect(EnachMandateExecution.findOne).toHaveBeenCalledWith({
      where: { decentro_txn_id: 'DTX-001' },
    });
    expect(result).toEqual(execution);
  });

  it('returns null without querying when decentro_txn_id is null', async () => {
    const result = await findEnachMandateExecutionByDecentroTxnId(null);

    expect(EnachMandateExecution.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('returns null without querying when decentro_txn_id is undefined', async () => {
    const result = await findEnachMandateExecutionByDecentroTxnId(undefined);

    expect(EnachMandateExecution.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('returns null when execution is not found', async () => {
    EnachMandateExecution.findOne.mockResolvedValue(null);

    const result = await findEnachMandateExecutionByDecentroTxnId('DTX-MISSING');

    expect(result).toBeNull();
  });

  it('throws on db error', async () => {
    EnachMandateExecution.findOne.mockRejectedValue(new Error('DB error'));

    await expect(
      findEnachMandateExecutionByDecentroTxnId('DTX-001')
    ).rejects.toThrow('DB error');
  });
});
