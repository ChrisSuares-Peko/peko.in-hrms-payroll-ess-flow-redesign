const { updateVerificationRecordByReference } = require('../../nupayVerificationRecord');
const nupayVerificationRecord = require('../../../entities/nupayVerificationRecord');

jest.mock('../../../entities/nupayVerificationRecord');
jest.mock('../../../entities/credential');

describe('updateVerificationRecordByReference', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update the record matching the given referenceNumber', async () => {
    nupayVerificationRecord.update.mockResolvedValue([1]);

    const data = { status: 'VALID', message: null, responsePayload: { uid: '1234' } };
    await updateVerificationRecordByReference('ABC123', data);

    expect(nupayVerificationRecord.update).toHaveBeenCalledWith(data, {
      where: { referenceNumber: 'ABC123' },
    });
  });

  it('should not return anything (fire-and-forget style)', async () => {
    nupayVerificationRecord.update.mockResolvedValue([1]);

    const result = await updateVerificationRecordByReference('ABC123', { status: 'INVALID' });

    expect(result).toBeUndefined();
  });

  it('should propagate errors from the database', async () => {
    nupayVerificationRecord.update.mockRejectedValue(new Error('DB Error'));

    await expect(
      updateVerificationRecordByReference('ABC123', { status: 'VALID' })
    ).rejects.toThrow('DB Error');
  });
});
