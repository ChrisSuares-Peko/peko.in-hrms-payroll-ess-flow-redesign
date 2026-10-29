const { createVerificationRecord } = require('../../nupayVerificationRecord');
const nupayVerificationRecord = require('../../../entities/nupayVerificationRecord');

jest.mock('../../../entities/nupayVerificationRecord');
jest.mock('../../../entities/credential');

describe('createVerificationRecord', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a verification record with the given data', async () => {
    const data = {
      accessKey: 'pan_verify',
      verificationType: 'PAN',
      credentialId: 10,
      corporateUserId: 5,
      packageId: 2,
      status: 'VALID',
      inputPayload: { pan: 'ABCPV1234D' },
      responsePayload: { status: 'VALID' },
    };
    const createdRecord = { id: 1, ...data };
    nupayVerificationRecord.create.mockResolvedValue(createdRecord);

    const result = await createVerificationRecord(data);

    expect(nupayVerificationRecord.create).toHaveBeenCalledWith(data);
    expect(result).toEqual(createdRecord);
  });

  it('should propagate errors from the database', async () => {
    const expectedError = new Error('DB Error');
    nupayVerificationRecord.create.mockRejectedValue(expectedError);

    await expect(createVerificationRecord({ accessKey: 'pan_verify' })).rejects.toThrow('DB Error');
  });
});
