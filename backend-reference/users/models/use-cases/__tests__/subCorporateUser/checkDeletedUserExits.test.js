const { checkDeletedUserExits } = require('../../subCorporateUser');
const SubCorporateUser = require('../../../entities/subCorporateUsers');
const { Op } = require('sequelize');

jest.mock('../../../entities/subCorporateUsers', () => ({
    findOne: jest.fn(),
}));

jest.mock('../../../entities/corporateUser', () => ({
    hasMany: jest.fn(),
}));

describe('SubCorporateUser Use-Cases - checkDeletedUserExits', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find and return a deleted user', async () => {
        const params = {
            email: 'test@example.com',
            corporateCredentialID: 'REDACTED'
        };
        const expectedUser = { email: 'test@example.com', corporateCredentialID: 'REDACTED', isDeleted: true };

        SubCorporateUser.findOne.mockResolvedValue(expectedUser);

        const result = await checkDeletedUserExits(params);

        expect(SubCorporateUser.findOne).toHaveBeenCalledWith({
            where: {
                [Op.and]: [
                    { email: params.email },
                    { corporateCredentialID: params.corporateCredentialID },
                    { isDeleted: true }
                ]
            }
        });
        expect(result).toEqual(expectedUser);
    });

    it('should return null if no deleted user is found', async () => {
        const params = {
            email: 'test@example.com',
            corporateCredentialID: 'REDACTED'
        };

        SubCorporateUser.findOne.mockResolvedValue(null);

        const result = await checkDeletedUserExits(params);

        expect(SubCorporateUser.findOne).toHaveBeenCalledWith({
            where: {
                [Op.and]: [
                    { email: params.email },
                    { corporateCredentialID: params.corporateCredentialID },
                    { isDeleted: true }
                ]
            }
        });
        expect(result).toBeNull();
    });

    it('should throw an error if the findOne method throws an error', async () => {
        const params = {
            email: 'test@example.com',
            corporateCredentialID: 'REDACTED'
        };
        const expectedError = new Error('Database error');

        SubCorporateUser.findOne.mockRejectedValue(expectedError);

        await expect(checkDeletedUserExits(params)).rejects.toThrow('Database error');
    });

    afterAll(() => {
        jest.resetAllMocks();
    });
});
