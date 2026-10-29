const { updateSubCorporate } = require('../../subCorporateUser');
const SubCorporateUsers = require('../../../entities/subCorporateUsers');
const emailer = require('../../../../utils/emailer');
const emailTemplates = require('../../../../utils/emailTemplate/userManagement');

jest.mock('../../../entities/subCorporateUsers', () => ({
    update: jest.fn(),
    findOne: jest.fn(),
}));

jest.mock('../../../entities/corporateUser', () => ({
    hasMany: jest.fn(),
  }));

jest.mock('../../../../utils/emailer', () => ({
    email: jest.fn(),
}));

jest.mock('../../../../utils/emailTemplate/userManagement', () => ({
    UpdateAccess: jest.fn(),
}));

describe('SubCorporateUser Use-Cases - updateSubCorporate', () => {
    const data = { name: 'Updated Name' };
    const params = { id: 1, email: 'admin@example.com' };
    const updatedRecord = {
        id: 1,
        email: 'user@example.com',
        name: 'Updated Name',
    };

    beforeEach(() => {
        jest.clearAllMocks(); // Clear all mocks before each test
    });

    it('should update the sub-corporate user and send an email', async () => {
        SubCorporateUsers.update.mockResolvedValue([1]);
        SubCorporateUsers.findOne.mockResolvedValue(updatedRecord);
        emailTemplates.UpdateAccess.mockReturnValue('emailBody');

        const result = await updateSubCorporate(data, params);

        expect(SubCorporateUsers.update).toHaveBeenCalledWith(data, { where: { id: params.id } });
        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({ where: { id: params.id } });
        expect(emailTemplates.UpdateAccess).toHaveBeenCalledWith(updatedRecord, params.email, {"branding": "Peko", "logo": "https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FPeko.png?alt=media&token=b46bed93-9cf9-493b-8c9c-a69ff0fedd09", "signUpImage": "https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FsignUpImage.png?alt=media&token=eb34687f-4d72-4b60-8b8e-dce18e8f2340"});
        expect(emailer.email).toHaveBeenCalledWith(
            updatedRecord.email,
            'Access Updated',
            'emailBody',
            expect.any(Function)
        );
        expect(result).toBe(true); // Expect true when affectedRows > 0
    });

    it('should not send an email if no rows were affected', async () => {
        SubCorporateUsers.update.mockResolvedValue([0]);

        const result = await updateSubCorporate(data, params);

        expect(SubCorporateUsers.update).toHaveBeenCalledWith(data, { where: { id: params.id } });
        expect(SubCorporateUsers.findOne).not.toHaveBeenCalled();
        expect(emailTemplates.UpdateAccess).not.toHaveBeenCalled();
        expect(emailer.email).not.toHaveBeenCalled();
        expect(result).toBe(false); // Expect false when affectedRows == 0
    });

    it('should return false if an error occurs during update', async () => {
        const error = new Error('Database error');
        SubCorporateUsers.update.mockRejectedValue(error);

        const result = await updateSubCorporate(data, params);

        expect(SubCorporateUsers.update).toHaveBeenCalledWith(data, { where: { id: params.id } });
        expect(SubCorporateUsers.findOne).not.toHaveBeenCalled();
        expect(emailTemplates.UpdateAccess).not.toHaveBeenCalled();
        expect(emailer.email).not.toHaveBeenCalled();
        expect(result).toBe(false); // Expect false on error
    });

    it('should return false if SubCorporateUsers.findOne fails', async () => {
        SubCorporateUsers.update.mockResolvedValue([1]);
        SubCorporateUsers.findOne.mockRejectedValue(new Error('Find one failed'));

        const result = await updateSubCorporate(data, params);

        expect(SubCorporateUsers.update).toHaveBeenCalledWith(data, { where: { id: params.id } });
        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({ where: { id: params.id } });
        expect(emailTemplates.UpdateAccess).not.toHaveBeenCalled();
        expect(emailer.email).not.toHaveBeenCalled();
        expect(result).toBe(false); // Expect false due to findOne failure
    });

    it('should handle missing email in params gracefully', async () => {
        const invalidParams = { ...params, email: undefined };

        SubCorporateUsers.update.mockResolvedValue([1]);
        SubCorporateUsers.findOne.mockResolvedValue(updatedRecord);
        emailTemplates.UpdateAccess.mockReturnValue('emailBody');

        const result = await updateSubCorporate(data, invalidParams);

        expect(SubCorporateUsers.update).toHaveBeenCalledWith(data, { where: { id: params.id } });
        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({ where: { id: params.id } });
        expect(emailTemplates.UpdateAccess).toHaveBeenCalledWith(updatedRecord, undefined, {"branding": "Peko", "logo": "https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FPeko.png?alt=media&token=b46bed93-9cf9-493b-8c9c-a69ff0fedd09", "signUpImage": "https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FsignUpImage.png?alt=media&token=eb34687f-4d72-4b60-8b8e-dce18e8f2340"});
        expect(emailer.email).toHaveBeenCalledWith(
            updatedRecord.email,
            'Access Updated',
            'emailBody',
            expect.any(Function)
        );
        expect(result).toBe(true); // Expect true when affectedRows > 0
    });

    it('should handle errors in email sending gracefully', async () => {
        SubCorporateUsers.update.mockResolvedValue([1]);
        SubCorporateUsers.findOne.mockResolvedValue(updatedRecord);
        emailTemplates.UpdateAccess.mockReturnValue('emailBody');
        emailer.email.mockImplementation(() => {
            throw new Error('Email sending error');
        });

        const result = await updateSubCorporate(data, params);

        expect(result).toBe(false); // Expect false due to email sending error
    });

    it('should handle errors in email template generation gracefully', async () => {
        SubCorporateUsers.update.mockResolvedValue([1]);
        SubCorporateUsers.findOne.mockResolvedValue(updatedRecord);
        emailTemplates.UpdateAccess.mockImplementation(() => {
            throw new Error('Template generation error');
        });

        const result = await updateSubCorporate(data, params);

        expect(result).toBe(false); // Expect false due to template generation error
        expect(emailer.email).not.toHaveBeenCalled(); // Email should not be sent
    });

    afterAll(() => {
        jest.resetAllMocks();
    });
});
