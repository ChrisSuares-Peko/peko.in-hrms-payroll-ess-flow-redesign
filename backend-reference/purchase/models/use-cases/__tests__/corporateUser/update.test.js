
const { update } = require('../../corporateUser');
const corporateUser = require('../../../entities/corporateUser');
const { uploadFile } = require('../../../../utils/commonUploadFile');


jest.mock('../../../entities/corporateUser');
jest.mock('../../../../utils/commonUploadFile');
jest.mock('../../../../middlewares/async', () => {
  return jest.fn((fn) => fn);
});

describe('corporateUser.update', () => {
  const params = { id: 1 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should upload profile image and update logo', async () => {
    uploadFile.mockResolvedValue('https://cdn.test/logo.png');
    corporateUser.update.mockResolvedValue([1]);

    const data = {
      profileImageBase: 'base64image',
      profileImageFormat: 'png',
    };

    const res = await update(params, data);

    expect(uploadFile).toHaveBeenCalledWith(
      'base64image',
      'profile',
      'png'
    );

    expect(corporateUser.update).toHaveBeenCalledWith(
      { logo: 'https://cdn.test/logo.png' },
      { where: { credentialId: params.id } }
    );

    expect(res).toEqual({
      result: 'https://cdn.test/logo.png',
      docs: { logo: 'https://cdn.test/logo.png' },
    });
  });

  it('should upload trade license doc and set kycStatus', async () => {
    uploadFile.mockResolvedValue('https://cdn.test/trade.pdf');
    corporateUser.update.mockResolvedValue([1]);

    const data = {
      tradeLicenseDoc: 'base64doc',
      trdLcnFormat: 'pdf',
    };

    const res = await update(params, data);

    expect(uploadFile).toHaveBeenCalledWith(
      'base64doc',
      'kyc',
      'pdf'
    );

    expect(corporateUser.update).toHaveBeenCalledWith(
      {
        tradeLicenseDoc: 'https://cdn.test/trade.pdf',
        kycStatus: 'underReview',
         trdLcnFormat: 'pdf',
      },
      { where: { credentialId: params.id } }
    );

    expect(res.docs.tradeLicenseDoc).toBe('https://cdn.test/trade.pdf');
  });

  it('should upload TRN certificate and set kycStatus', async () => {
    uploadFile.mockResolvedValue('https://cdn.test/trn.pdf');
    corporateUser.update.mockResolvedValue([1]);

    const data = {
      trnCertificate: 'base64trn',
      trnCertFormat: 'pdf',
    };

    const res = await update(params, data);

    expect(uploadFile).toHaveBeenCalledWith(
      'base64trn',
      'kyc',
      'pdf'
    );

   expect(corporateUser.update).toHaveBeenCalledWith(
  {
    trnCertificate: 'https://cdn.test/trn.pdf',
    trnCertFormat: 'pdf',
    kycStatus: 'underReview',
  },
  { where: { credentialId: params.id } }
);


    expect(res.docs.trnCertificate).toBe('https://cdn.test/trn.pdf');
  });

  it('should update corporate user without uploads', async () => {
    corporateUser.update.mockResolvedValue([1]);

    const data = {
      companyName: 'Test Corp',
    };

    const res = await update(params, data);

    expect(uploadFile).not.toHaveBeenCalled();

    expect(corporateUser.update).toHaveBeenCalledWith(
      data,
      { where: { credentialId: params.id } }
    );

    expect(res).toEqual({
      result: [1],
      docs: {},
    });
  });

  it('should throw error when update fails', async () => {
    corporateUser.update.mockRejectedValue(new Error('DB error'));

    await expect(
      update(params, { companyName: 'Fail Corp' })
    ).rejects.toThrow('DB error');
  });
});
