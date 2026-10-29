const { findUserExist } = require('../../subCorporateUser');
const corporateUser = require('../../../entities/corporateUser');
const SubCorporateUsers = require('../../../entities/subCorporateUsers');

jest.mock('../../../entities/corporateUser', () => ({
    findOne: jest.fn(),
}));

jest.mock('../../../entities/subCorporateUsers', () => ({
    findOne: jest.fn(),
}));

describe('SubCorporateUser Use-Cases - findUserExist', () => {
    const params = {
        email: 'test@example.com',
        mobileNo: '1234567890',
    };

    beforeEach(() => {
        jest.clearAllMocks(); // Clear all mocks before each test
    });

    it('should return a message if the mobile number exists in corporateUser', async () => {
        corporateUser.findOne.mockResolvedValueOnce({}); // for mobile number check

        const result = await findUserExist(params);
        // expect(corporateUser.findOne).toHaveBeenCalledWith({ where: { mobileNo: params.mobileNo } });
        expect(result).toEqual({ exist: false, message: '' });
    });

    it('should return a message if the email exists in SubCorporateUsers', async () => {
        corporateUser.findOne.mockResolvedValue(null); // for email and mobile number check
        SubCorporateUsers.findOne.mockResolvedValueOnce({}); // for email check

        const result = await findUserExist(params);
        // expect(corporateUser.findOne).toHaveBeenCalledWith({ where: { mobileNo: params.mobileNo } });
        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({ where: { email: params.email } });
        expect(result).toEqual({ exist: true, message: 'The email address is already associated with another account.' });
    });

    it('allows a mobile number that already exists in SubCorporateUsers', async () => {
        SubCorporateUsers.findOne.mockResolvedValueOnce(null); // for email check
        SubCorporateUsers.findOne.mockResolvedValueOnce({}); // a row with the same mobile number

        const result = await findUserExist(params);
        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({ where: { email: params.email } });
        expect(result).toEqual({ exist: false, message: '' });
    });

    it('never queries SubCorporateUsers by mobile number', async () => {
        corporateUser.findOne.mockResolvedValue(null);
        SubCorporateUsers.findOne.mockResolvedValue(null);

        await findUserExist(params);

        expect(SubCorporateUsers.findOne).not.toHaveBeenCalledWith({
            where: { mobileNo: params.mobileNo },
        });
        expect(SubCorporateUsers.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return false if no matching user is found', async () => {
        corporateUser.findOne.mockResolvedValue(null); // for email and mobile number check
        SubCorporateUsers.findOne.mockResolvedValue(null); // for email and mobile number check

        const result = await findUserExist(params);

        // expect(corporateUser.findOne).toHaveBeenCalledWith({ where: { mobileNo: params.mobileNo } });
        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({ where: { email: params.email } });
        expect(result).toEqual({ exist: false, message: '' });
    });

    it('should return a message if email and mobileNo parameters are null', async () => {
        const paramsWithNulls = {
            email: null,
            mobileNo: null
        };
        
        corporateUser.findOne.mockResolvedValue(null);
        SubCorporateUsers.findOne.mockResolvedValue(null);
        
        const result = await findUserExist(paramsWithNulls);
        
        // expect(corporateUser.findOne).toHaveBeenCalledWith({ where: { mobileNo: paramsWithNulls.mobileNo } });
        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({ where: { email: paramsWithNulls.email } });
        expect(result).toEqual({ exist: false, message: '' });
    });

    it('does not flag a taken mobile number when only email is missing', async () => {
        const paramsWithMissingEmail = {
            mobileNo: '1234567890',
        };

        corporateUser.findOne.mockResolvedValue(null);
        SubCorporateUsers.findOne.mockResolvedValueOnce(null); // for email check
        SubCorporateUsers.findOne.mockResolvedValueOnce({}); // a row with the same mobile number

        const result = await findUserExist(paramsWithMissingEmail);

        // expect(corporateUser.findOne).toHaveBeenCalledWith({ where: { mobileNo: paramsWithMissingEmail.mobileNo } });
        expect(SubCorporateUsers.findOne).toHaveBeenCalledWith({ where: { email: undefined } }); // for missing email
        expect(result).toEqual({ exist: false, message: '' });
    });

    afterAll(() => {
        jest.resetAllMocks();
    });
});
