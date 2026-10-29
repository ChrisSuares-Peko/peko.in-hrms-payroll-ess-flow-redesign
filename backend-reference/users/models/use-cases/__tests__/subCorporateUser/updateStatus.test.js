const { updateStatus } = require('../../subCorporateUser'); // Adjust path as needed
const SubCorporateUsers = require('../../../entities/subCorporateUsers');
const emailer = require('../../../../utils/emailer'); // Adjust path as needed
const emailTemplates = require('../../../../utils/emailTemplate/userManagement'); // Adjust path as needed

jest.mock('../../../entities/subCorporateUsers', () => ({
    update: jest.fn(),
    findOne: jest.fn(),
}));

jest.mock('../../../../utils/emailer', () => ({
    email: jest.fn(),
}));

jest.mock('../../../entities/corporateUser', () => ({
    hasMany: jest.fn(),
  }));

jest.mock('../../../../utils/emailTemplate/userManagement', () => ({
    disableAccess: jest.fn(),
}));

describe('SubCorporateUser Use-Cases - updateStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the status and send an email if status is INACTIVE', async () => {
        const params = {
            status: 'INACTIVE',
            id: 1,
            email: 'test@example.com',
            corporateCredentialID: 99
        };

        SubCorporateUsers.update.mockResolvedValue([1]); // Simulate that 1 row was affected
        SubCorporateUsers.findOne.mockResolvedValue({
            id: 1,
            name: 'Test User',
            email: 'test@example.com'
        });
        emailTemplates.disableAccess.mockReturnValue('Email body');

        await updateStatus(params);

        expect(SubCorporateUsers.update).toHaveBeenCalledWith(
            { status: 'INACTIVE' },
            { where: expect.objectContaining({ id: params.id, corporateCredentialID: '99', isDeleted: false }) }
        );

        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({
            where: { id: params.id }
        });

        expect(emailTemplates.disableAccess).toHaveBeenCalledWith('Test User', params.email,{"baseUrl": "https://in.peko.one", "branding": "Peko", "logo": "https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FPeko.png?alt=media&token=b46bed93-9cf9-493b-8c9c-a69ff0fedd09", "signUpImage": "https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FsignUpImage.png?alt=media&token=eb34687f-4d72-4b60-8b8e-dce18e8f2340"});
        expect(emailer.email).toHaveBeenCalledWith(
            'test@example.com',
            'Account disabled',
            'Email body',
            expect.any(Function)
        );
    });

    it('should handle errors gracefully and return false if the update fails', async () => {
        const params = {
            status: 'ACTIVE',
            id: 1,
            email: 'test@example.com',
            corporateCredentialID: 99
        };

        SubCorporateUsers.update.mockRejectedValue(new Error('Update failed'));

        const result = await updateStatus(params);

        expect(result).toBe(false);
        expect(SubCorporateUsers.update).toHaveBeenCalledWith(
            { status: params.status },
            { where: expect.objectContaining({ id: params.id, corporateCredentialID: '99', isDeleted: false }) }
        );
        expect(SubCorporateUsers.findOne).not.toHaveBeenCalled();
        expect(emailer.email).not.toHaveBeenCalled();
    });

    it('should not send an email if status is not INACTIVE', async () => {
        const params = {
            status: 'ACTIVE',
            id: 1,
            email: 'test@example.com',
            corporateCredentialID: 99
        };

        SubCorporateUsers.update.mockResolvedValue([1]);

        await updateStatus(params);

        expect(SubCorporateUsers.update).toHaveBeenCalledWith(
            { status: 'ACTIVE' },
            { where: expect.objectContaining({ id: params.id, corporateCredentialID: '99', isDeleted: false }) }
        );

        expect(SubCorporateUsers.findOne).not.toHaveBeenCalled();
        expect(emailer.email).not.toHaveBeenCalled();
    });

    it('should handle errors in email template generation gracefully', async () => {
        const params = {
            status: 'INACTIVE',
            id: 1,
            email: 'test@example.com',
            corporateCredentialID: 99
        };

        SubCorporateUsers.update.mockResolvedValue([1]);
        SubCorporateUsers.findOne.mockResolvedValue({
            id: 1,
            name: 'Test User',
            email: 'test@example.com'
        });
        emailTemplates.disableAccess.mockImplementation(() => {
            throw new Error('Template generation error');
        });

        const result = await updateStatus(params);

        expect(result).toBe(false); // Expect false due to template generation error
        expect(emailer.email).not.toHaveBeenCalled(); // Email should not be sent
    });

    it('should handle errors during email sending gracefully', async () => {
        const params = {
            status: 'INACTIVE',
            id: 1,
            email: 'test@example.com',
            corporateCredentialID: 99
        };

        SubCorporateUsers.update.mockResolvedValue([1]);
        SubCorporateUsers.findOne.mockResolvedValue({
            id: 1,
            name: 'Test User',
            email: 'test@example.com'
        });
        emailTemplates.disableAccess.mockReturnValue('Email body');
        emailer.email.mockImplementation(() => {
            throw new Error('Email sending error');
        });

        const result = await updateStatus(params);

        expect(result).toBe(false); // Expect false as affectedRows > 0
    });

    it('should return false if SubCorporateUsers.findOne fails', async () => {
        const params = {
            status: 'INACTIVE',
            id: 1,
            email: 'test@example.com',
            corporateCredentialID: 99
        };

        SubCorporateUsers.update.mockResolvedValue([1]);
        SubCorporateUsers.findOne.mockRejectedValue(new Error('Find one failed'));

        const result = await updateStatus(params);

        expect(result).toBe(false); // Expect false due to findOne failure
        expect(emailer.email).not.toHaveBeenCalled(); // Email should not be sent
    });

    it('should call updateSubCorporateServices if status is INACTIVE', async () => {
        const params = {
            status: 'INACTIVE',
            id: 1,
            email: 'test@example.com',
            corporateCredentialID: 99
        };

        SubCorporateUsers.update.mockResolvedValue([1]);
        SubCorporateUsers.findOne.mockResolvedValue({
            id: 1,
            name: 'Test User',
            email: 'test@example.com'
        });
        emailTemplates.disableAccess.mockReturnValue('Email body');

        // Mock updateSubCorporateServices function
        const mockUpdateSubCorporateServices = jest.fn();
        require('../../subCorporateUser').updateSubCorporateServices = mockUpdateSubCorporateServices;

        await updateStatus(params);

        expect(mockUpdateSubCorporateServices).toHaveBeenCalledWith(params.id);
    });

    afterAll(() => {
        jest.resetAllMocks();
    });
});
