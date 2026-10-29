const { restoreSubCorporate } = require('../../subCorporateUser');
const SubCorporateUsers = require('../../../entities/subCorporateUsers');
const { Op } = require('sequelize');

jest.mock('../../../entities/subCorporateUsers', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
}));

jest.mock('../../../entities/corporateUser', () => ({
    hasMany: jest.fn(),
}));

describe('SubCorporateUser Use-Cases - restoreSubCorporate', () => {

    beforeEach(() => {
        jest.clearAllMocks(); // Clear all mocks before each test
    });

    it('should restore a deleted user when found', async () => {
        const params = {
            email: 'test@example.com',
            corporateCredentialID: 'REDACTED',
            services: [
                { label: "Gift Cards", hasAccess: true },
                { label: "Corporate Cards", hasAccess: true },
                { label: "Rewards", hasAccess: true }
            ]
        };
        const user = { id: 1, email: 'test@example.com', corporateCredentialID: 'REDACTED', isDeleted: true };

        SubCorporateUsers.findOne.mockResolvedValue(user);
        SubCorporateUsers.update.mockResolvedValue([1]);

        const result = await restoreSubCorporate(params);

        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({
            where: {
                [Op.and]: [
                    { email: params.email },
                    { corporateCredentialID: params.corporateCredentialID },
                    { isDeleted: true }
                ]
            }
        });
        expect(SubCorporateUsers.update).toHaveBeenCalledWith({
            isDeleted: false,
            services: params.services
        }, {
            where: { id: user.id }
        });
        expect(result).toBe(true);
    });

    it('should return false if no user is found', async () => {
        const params = {
            email: 'test@example.com',
            corporateCredentialID: 'REDACTED',
            services: [
                { label: "Gift Cards", hasAccess: true },
                { label: "Corporate Cards", hasAccess: true },
                { label: "Rewards", hasAccess: true }
            ]
        };

        SubCorporateUsers.findOne.mockResolvedValue(null);

        const result = await restoreSubCorporate(params);

        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({
            where: {
                [Op.and]: [
                    { email: params.email },
                    { corporateCredentialID: params.corporateCredentialID },
                    { isDeleted: true }
                ]
            }
        });
        expect(SubCorporateUsers.update).not.toHaveBeenCalled();
        expect(result).toBe(false);
    });

    it('should return false and log error if an error occurs', async () => {
        const params = {
            email: 'test@example.com',
            corporateCredentialID: 'REDACTED',
            services: [
                { label: "Gift Cards", hasAccess: true },
                { label: "Corporate Cards", hasAccess: true },
                { label: "Rewards", hasAccess: true }
            ]
        };
        const error = new Error('Database error');

        SubCorporateUsers.findOne.mockRejectedValue(error);

        const result = await restoreSubCorporate(params);

        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({
            where: {
                [Op.and]: [
                    { email: params.email },
                    { corporateCredentialID: params.corporateCredentialID },
                    { isDeleted: true }
                ]
            }
        });
        expect(SubCorporateUsers.update).not.toHaveBeenCalled();
        expect(result).toBe(false);
    });

    it('should return false if updating the user fails', async () => {
        const params = {
            email: 'test@example.com',
            corporateCredentialID: 'REDACTED',
            services: [
                { label: "Gift Cards", hasAccess: true },
                { label: "Corporate Cards", hasAccess: true },
                { label: "Rewards", hasAccess: true }
            ]
        };
        const user = { id: 1, email: 'test@example.com', corporateCredentialID: 'REDACTED', isDeleted: true };

        SubCorporateUsers.findOne.mockResolvedValue(user);
        SubCorporateUsers.update.mockRejectedValue(new Error('Update error'));

        const result = await restoreSubCorporate(params);

        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({
            where: {
                [Op.and]: [
                    { email: params.email },
                    { corporateCredentialID: params.corporateCredentialID },
                    { isDeleted: true }
                ]
            }
        });
        expect(SubCorporateUsers.update).toHaveBeenCalledWith({
            isDeleted: false,
            services: params.services
        }, {
            where: { id: user.id }
        });
        expect(result).toBe(false);
    });

    it('should handle multiple concurrent calls correctly', async () => {
        const params1 = {
            email: 'test1@example.com',
            corporateCredentialID: 'REDACTED',
            services: [
                { label: "Gift Cards", hasAccess: true },
                { label: "Corporate Cards", hasAccess: true },
                { label: "Rewards", hasAccess: true }
            ]
        };
        const params2 = {
            email: 'test2@example.com',
            corporateCredentialID: 'REDACTED',
            services: [
                { label: "Gift Cards", hasAccess: true },
                { label: "Corporate Cards", hasAccess: false },
                { label: "Rewards", hasAccess: true }
            ]
        };

        const user1 = { id: 1, email: 'test1@example.com', corporateCredentialID: 'REDACTED', isDeleted: true };
        const user2 = { id: 2, email: 'test2@example.com', corporateCredentialID: 'REDACTED', isDeleted: true };

        SubCorporateUsers.findOne.mockImplementationOnce(() => Promise.resolve(user1));
        SubCorporateUsers.findOne.mockImplementationOnce(() => Promise.resolve(user2));
        SubCorporateUsers.update.mockResolvedValue([1]);

        const [result1, result2] = await Promise.all([
            restoreSubCorporate(params1),
            restoreSubCorporate(params2)
        ]);

        expect(SubCorporateUsers.findOne).toHaveBeenCalledTimes(2);
        expect(SubCorporateUsers.update).toHaveBeenCalledTimes(2);
        expect(result1).toBe(true);
        expect(result2).toBe(true);
    });

});
