const EnachMandate = require('../../../entities/eNachMandate');
const { findEnachMandateByReferenceId } = require('../../eNachMandate');

jest.mock('../../../entities/eNachMandate', () => ({
  findOne: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('findEnachMandateByReferenceId', () => {
  it('returns the mandate when found', async () => {
    const mandate = { id: 1, reference_id: 'ENACH-REF-001', status: 'PENDING' };
    EnachMandate.findOne.mockResolvedValue(mandate);

    const result = await findEnachMandateByReferenceId('ENACH-REF-001');

    expect(EnachMandate.findOne).toHaveBeenCalledWith({
      where: { reference_id: 'ENACH-REF-001' },
      raw: true,
    });
    expect(result).toEqual(mandate);
  });

  it('queries with raw: true', async () => {
    EnachMandate.findOne.mockResolvedValue(null);

    await findEnachMandateByReferenceId('ENACH-REF-001');

    const callArg = EnachMandate.findOne.mock.calls[0][0];
    expect(callArg.raw).toBe(true);
  });

  it('returns null when mandate is not found', async () => {
    EnachMandate.findOne.mockResolvedValue(null);

    const result = await findEnachMandateByReferenceId('ENACH-NOTFOUND');

    expect(result).toBeNull();
  });

  it('throws on db error', async () => {
    EnachMandate.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findEnachMandateByReferenceId('ENACH-REF-001')).rejects.toThrow('DB error');
  });
});
