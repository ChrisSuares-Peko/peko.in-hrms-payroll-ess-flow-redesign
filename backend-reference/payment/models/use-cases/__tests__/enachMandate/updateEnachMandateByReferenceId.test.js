const EnachMandate = require('../../../entities/eNachMandate');
const { updateEnachMandateByReferenceId } = require('../../eNachMandate');

jest.mock('../../../entities/eNachMandate', () => ({
  update: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('updateEnachMandateByReferenceId', () => {
  it('updates and returns the updatedCount', async () => {
    EnachMandate.update.mockResolvedValue([1]);

    const result = await updateEnachMandateByReferenceId('ENACH-REF-001', { status: 'ACTIVE' });

    expect(EnachMandate.update).toHaveBeenCalledWith(
      { status: 'ACTIVE' },
      { where: { reference_id: 'ENACH-REF-001' } }
    );
    expect(result).toBe(1);
  });

  it('returns 0 when no record matches', async () => {
    EnachMandate.update.mockResolvedValue([0]);

    const result = await updateEnachMandateByReferenceId('ENACH-NONE', { status: 'ACTIVE' });

    expect(result).toBe(0);
  });

  it('can update multiple fields in a single call', async () => {
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
