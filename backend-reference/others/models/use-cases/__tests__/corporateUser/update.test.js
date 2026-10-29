const { update } = require('../../corporateUser'); // Adjust the path as needed
const corporateUser = require('../../../entities/corporateUser');
const credential = require('../../../entities/credential');
const subCorporateUsers = require('../../../entities/subCorporateUsers');
const sequelize = require('../../../../configs/database/index');
const { uploadFile } = require('../../../../utils/s3');

jest.mock('../../../entities/corporateUser', () => ({
  update: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({
  update: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock('../../../entities/subCorporateUsers', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../../utils/s3', () => ({
  uploadFile: jest.fn(),
}));

describe('update', () => {
  let mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    jest.spyOn(sequelize, 'transaction').mockResolvedValue(mockTransaction);
  });

  it('should update corporate user without profile image upload', async () => {
    const mockParams = { corporateId: 1 };
    const mockData = { companyName: 'New Company Name' };
    const mockResult = [1];

    corporateUser.update.mockResolvedValue(mockResult);

    // Call the update function
    const result = await update(mockParams, mockData);

    // Verify that uploadFile was not called
    expect(uploadFile).not.toHaveBeenCalled();

    // Verify that the corporateUser.update function was called with the correct parameters
    expect(corporateUser.update).toHaveBeenCalledWith(
      { companyName: 'New Company Name' },
      { where: { credentialId: mockParams.corporateId }, transaction: mockTransaction }
    );

    // No email/name in the payload, credentials must stay untouched
    expect(credential.update).not.toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();

    // Check that the result is as expected
    expect(result).toEqual({ result: mockResult, docs: {} });
  });

  it('should update corporate user without document uploads', async () => {
    const mockParams = { corporateId: 1 };
    const mockData = { companyName: 'Updated Company' };
    const mockResult = [1];

    corporateUser.update.mockResolvedValue(mockResult);

    const result = await update(mockParams, mockData);

    expect(uploadFile).not.toHaveBeenCalled();
    expect(corporateUser.update).toHaveBeenCalledWith(
      { companyName: 'Updated Company', isMFA: undefined },
      { where: { credentialId: mockParams.corporateId }, transaction: mockTransaction }
    );
    expect(result).toEqual({ result: mockResult, docs: {} });
  });

  it('should sync email and name to credentials in the same transaction', async () => {
    corporateUser.findOne.mockResolvedValue(null);
    subCorporateUsers.findOne.mockResolvedValue(null);
    credential.findOne.mockResolvedValue(null);
    corporateUser.update.mockResolvedValue([1]);
    credential.update.mockResolvedValue([1]);

    const result = await update({ corporateId: 1 }, { name: 'ACME', email: 'New@Acme.com' });

    expect(corporateUser.update).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@acme.com', name: 'ACME' }),
      { where: { credentialId: 1 }, transaction: mockTransaction }
    );
    expect(credential.update).toHaveBeenCalledWith(
      { email: 'new@acme.com', name: 'ACME' },
      { where: { id: 1 }, transaction: mockTransaction }
    );
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(result).toEqual({ result: [1], docs: {} });
  });

  it('should reject when the mobile number belongs to another account', async () => {
    corporateUser.findOne.mockResolvedValue({ email: 'other@acme.com', mobileNo: '9999999999' });
    subCorporateUsers.findOne.mockResolvedValue(null);
    credential.findOne.mockResolvedValue(null);

    await expect(
      update({ corporateId: 1 }, { email: 'me@acme.com', mobileNo: '9999999999' })
    ).rejects.toThrow('The mobile number is already associated with another account.');

    expect(corporateUser.update).not.toHaveBeenCalled();
    expect(credential.update).not.toHaveBeenCalled();
  });

  it('should reject when the email exists on another credential', async () => {
    corporateUser.findOne.mockResolvedValue(null);
    subCorporateUsers.findOne.mockResolvedValue(null);
    credential.findOne.mockResolvedValue({ id: 42 });

    await expect(
      update({ corporateId: 1 }, { email: 'taken@acme.com' })
    ).rejects.toThrow('The email ID is already associated with another account.');

    expect(corporateUser.update).not.toHaveBeenCalled();
  });

  it('should roll back both writes when the credential update fails', async () => {
    corporateUser.findOne.mockResolvedValue(null);
    subCorporateUsers.findOne.mockResolvedValue(null);
    credential.findOne.mockResolvedValue(null);
    corporateUser.update.mockResolvedValue([1]);
    credential.update.mockRejectedValue(new Error('db down'));

    await expect(update({ corporateId: 1 }, { email: 'new@acme.com' })).rejects.toThrow('db down');

    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(mockTransaction.commit).not.toHaveBeenCalled();
  });
});
