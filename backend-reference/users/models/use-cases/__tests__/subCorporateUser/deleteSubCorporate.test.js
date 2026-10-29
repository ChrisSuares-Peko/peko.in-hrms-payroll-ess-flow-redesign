const { Op } = require('sequelize');
const { deleteSubCorporate } = require('../../subCorporateUser');
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
    disableAccess: jest.fn(),
}));

describe('SubCorporateUser Use-Cases - deleteSubCorporate', () => {
    const subCorporateId = 1;
    const email = 'admin@example.com';
    const corporateCredentialID = 99;
    const args = { subCorporateId, email, corporateCredentialID };
    const updatedRecord = {
        id: 1,
        email: 'user@example.com',
        name: 'User Name',
        status: 'ACTIVE' // Default status
    };

    beforeEach(() => {
        jest.clearAllMocks(); // Clear all mocks before each test
    });

    it('should delete the sub-corporate user and send an email', async () => {
        SubCorporateUsers.update.mockResolvedValue([1]);
        SubCorporateUsers.findOne.mockResolvedValue(updatedRecord);
        emailTemplates.disableAccess.mockReturnValue('emailBody');

        const result = await deleteSubCorporate(args);

        expect(SubCorporateUsers.update).toHaveBeenCalledWith(
            { isDeleted: true },
            { where: expect.objectContaining({ id: subCorporateId, corporateCredentialID: '99', isDeleted: false }) }
        );
        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({ where: { id: subCorporateId } });
        expect(emailTemplates.disableAccess).toHaveBeenCalledWith(updatedRecord.name, email, undefined);
        expect(emailer.email).toHaveBeenCalledWith(
            updatedRecord.email,
            'Your  account access has been disabled',
            'emailBody',
            expect.any(Function)
        );
        expect(result).toBe(true); // Expect true when affectedRows > 0
    });

    it('should not send an email if no rows were affected', async () => {
        SubCorporateUsers.update.mockResolvedValue([0]);

        const result = await deleteSubCorporate(args);

        expect(SubCorporateUsers.update).toHaveBeenCalledWith(
            { isDeleted: true },
            { where: expect.objectContaining({ id: subCorporateId, corporateCredentialID: '99', isDeleted: false }) }
        );
        expect(SubCorporateUsers.findOne).not.toHaveBeenCalled();
        expect(emailTemplates.disableAccess).not.toHaveBeenCalled();
        expect(emailer.email).not.toHaveBeenCalled();
        expect(result).toBe(false); // Expect false when affectedRows == 0
    });

    it('should return false if an error occurs during the update operation', async () => {
        const error = new Error('Database error');
        SubCorporateUsers.update.mockRejectedValue(error);

        const result = await deleteSubCorporate(args);

        expect(SubCorporateUsers.update).toHaveBeenCalledWith(
            { isDeleted: true },
            { where: expect.objectContaining({ id: subCorporateId, corporateCredentialID: '99', isDeleted: false }) }
        );
        expect(SubCorporateUsers.findOne).not.toHaveBeenCalled();
        expect(emailTemplates.disableAccess).not.toHaveBeenCalled();
        expect(emailer.email).not.toHaveBeenCalled();
        expect(result).toBe(false); // Expect false on error
    });

    it('should not send an email if the status is "INACTIVE"', async () => {
        const inactiveRecord = { ...updatedRecord, status: 'INACTIVE' };
        SubCorporateUsers.update.mockResolvedValue([1]);
        SubCorporateUsers.findOne.mockResolvedValue(inactiveRecord);

        const result = await deleteSubCorporate(args);

        expect(SubCorporateUsers.update).toHaveBeenCalledWith(
            { isDeleted: true },
            { where: expect.objectContaining({ id: subCorporateId, corporateCredentialID: '99', isDeleted: false }) }
        );
        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({ where: { id: subCorporateId } });
        expect(emailTemplates.disableAccess).not.toHaveBeenCalled();
        expect(emailer.email).not.toHaveBeenCalled();
        expect(result).toBe(true); // Expect true when affectedRows > 0
    });

    it('should handle errors thrown during email sending gracefully', async () => {
        SubCorporateUsers.update.mockResolvedValue([1]);
        SubCorporateUsers.findOne.mockResolvedValue(updatedRecord);
        emailer.email.mockImplementation(() => {
            throw new Error('Email sending error'); // Simulate email sending error
        });
        emailTemplates.disableAccess.mockReturnValue('emailBody');

        const result = await deleteSubCorporate(args);

        expect(result).toBe(false); // Expect false due to the email sending error
    });

    it('should handle errors in email template generation gracefully', async () => {
        SubCorporateUsers.update.mockResolvedValue([1]);
        SubCorporateUsers.findOne.mockResolvedValue(updatedRecord);
        emailTemplates.disableAccess.mockImplementation(() => {
            throw new Error('Template error'); // Simulate template generation error
        });

        const result = await deleteSubCorporate(args);

        expect(result).toBe(false); // Expect false due to the template generation error
        expect(emailer.email).not.toHaveBeenCalled(); // Email should not be sent
    });

    // Both predicates are load-bearing: without the tenant scope this matched on id alone (any corporate
    // admin could soft-delete any sub-user on the platform), and deleting the owner's row is unrecoverable
    // because the mobile unique index does not exclude deleted rows.
    it('scopes the delete to the acting corporate and excludes the owner row', async () => {
        SubCorporateUsers.update.mockResolvedValue([0]);

        await deleteSubCorporate(args);

        const { where } = SubCorporateUsers.update.mock.calls[0][1];
        expect(where.corporateCredentialID).toBe('99');
        expect(where.isDeleted).toBe(false);
        // Qualified with the TABLE, not the model alias. Sequelize emits an UPDATE against the bare table
        // with no alias, so an alias-qualified literal is an unknown column — MySQL rejects the whole
        // statement, the catch below turns it into `false`, and the caller answers "User not found or
        // already deleted" for a member that exists. That is the bug this asserts against.
        expect(String(where[Op.and][0].val)).toContain('NOT (`subCorporateUsers`.`credentialId`');
        expect(String(where[Op.and][0].val)).not.toContain('`subCorporateUser`.`credentialId`');
    });

    afterAll(() => {
        jest.resetAllMocks();
    });
});
