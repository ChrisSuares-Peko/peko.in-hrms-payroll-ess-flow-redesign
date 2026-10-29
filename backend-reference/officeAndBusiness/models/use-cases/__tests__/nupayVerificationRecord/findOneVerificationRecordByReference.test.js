const { findOneVerificationRecordByReference } = require('../../nupayVerificationRecord');
const nupayVerificationRecord = require('../../../entities/nupayVerificationRecord');

jest.mock('../../../entities/nupayVerificationRecord');
jest.mock('../../../entities/credential');

describe('findOneVerificationRecordByReference', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should query by referenceNumber only when credentialId is not provided', async () => {
    const record = { id: 1, referenceNumber: 'ABC123', status: 'PENDING' };
    nupayVerificationRecord.findOne.mockResolvedValue(record);

    const result = await findOneVerificationRecordByReference('ABC123');

    expect(nupayVerificationRecord.findOne).toHaveBeenCalledWith({
      where: { referenceNumber: 'ABC123' },
    });
    expect(result).toEqual(record);
  });

  it('should scope the query to credentialId when provided', async () => {
    nupayVerificationRecord.findOne.mockResolvedValue(null);

    const result = await findOneVerificationRecordByReference('ABC123', 42);

    expect(nupayVerificationRecord.findOne).toHaveBeenCalledWith({
      where: { referenceNumber: 'ABC123', credentialId: 42 },
    });
    expect(result).toBeNull();
  });

  it('should not add credentialId to the where clause when it is falsy', async () => {
    nupayVerificationRecord.findOne.mockResolvedValue(null);

    await findOneVerificationRecordByReference('ABC123', 0);

    expect(nupayVerificationRecord.findOne).toHaveBeenCalledWith({
      where: { referenceNumber: 'ABC123' },
    });
  });

  it('should propagate errors from the database', async () => {
    nupayVerificationRecord.findOne.mockRejectedValue(new Error('DB Error'));

    await expect(findOneVerificationRecordByReference('ABC123')).rejects.toThrow('DB Error');
  });
});
