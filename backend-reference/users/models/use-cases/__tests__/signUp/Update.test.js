const { Update } = require('../../signUp'); 
const credential = require('../../../entities/credential');
const wallet = require('../../../entities/wallet');
const Package = require('../../../entities/package');
const corporateUser = require('../../../entities/corporateUser');
const Subscription = require('../../../entities/subscription');

const sequelize = require('../../../../configs/database/index');  
const  ErrorResponse  = require('../../../../utils/error-response');
const emailer = require('../../../../utils/emailer');

jest.mock('../../../entities/credential');
jest.mock('../../../entities/wallet');
jest.mock('../../../entities/package');
jest.mock('../../../../utils/emailer');
jest.mock('../../../entities/corporateUser', () =>({
    create: jest.fn(), 
    hasMany: jest.fn(),
    hasOne: jest.fn(),
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/subscription');

jest.mock('../../../../utils/emailTemplate/signUp', () => ({
    accountCreatedSuccessTemplate: jest.fn()
}));

describe('Update Function', () => {
    let transaction;
    beforeEach(() => {
        jest.clearAllMocks();
        transaction = {
            commit: jest.fn().mockResolvedValue(true),
            rollback: jest.fn().mockResolvedValue(true)
        };
        sequelize.transaction = jest.fn().mockResolvedValue(transaction);
    });

    // it('should successfully update data and send an email', async () => {
    //     const params = { id: 1 };
    //     const requestData = {
    //         password: 'REDACTED',
    //         mobileNo: '1234567890',
    //         email: 'test@example.com',
    //         website: 'example.com',
    //         contactPersonEmail: 'contact@example.com',
    //         contactPersonNumber: '9876543210',
    //         acs_user_id: 'acs123',
    //         registeredBy: 'partnerId'
    //     };
    //     const accessCodeData = { id: 2, groupId: 3 };

    //     credential.hashPassword.mockResolvedValue('hashedNewPassword123');
    //     credential.create.mockResolvedValue({ id: 1 });
    //     wallet.create.mockResolvedValue(true);
    //     Package.findOne.mockResolvedValue({ id: 1 });
    //     corporateUser.create.mockResolvedValue({ id: 1 });
    //     Subscription.create.mockResolvedValue(true);
       
    //     jest.spyOn(require('../../../../utils/emailTemplate/signUp'), 'accountCreatedSuccessTemplate').mockResolvedValue('emailBody');
    //     emailer.email.mockResolvedValue(true);

    //     const result = await Update(params, requestData, accessCodeData);

    //     expect(transaction.commit).toHaveBeenCalled();
    //     expect(credential.hashPassword).toHaveBeenCalledWith('newPassword123');
    //     expect(credential.create).toHaveBeenCalledWith(
    //         { ...requestData, password: 'REDACTED', role: 'CORPORATE' },
    //         { transaction }
    //     );
    //     expect(wallet.create).toHaveBeenCalledWith({ credentialId: 1 }, { transaction });
    //     expect(Package.findOne).toHaveBeenCalledWith({
    //         where: {  "packageType": "GROUP", partnerId: 'partnerId',"status": true, },
    //         transaction,
    //         attributes: ['id'],
    //         raw: true
    //     });
    //     expect(corporateUser.create).toHaveBeenCalledWith({
    //         ...requestData,
    //         credentialId: 1,
    //         packageId: 1,
    //         mobileNo: requestData.mobileNo,
    //         email: requestData.email,
    //         website: requestData.website,
    //         contactPersonEmail: requestData.contactPersonEmail,
    //         contactPersonPhone: requestData.contactPersonNumber,
    //         acs_user_id: requestData.acs_user_id,
    //     }, { transaction });
    //     expect(Subscription.create).toHaveBeenCalledWith({
    //         subscriptionStartDate: moment().startOf('day').toDate(),
    //         subscriptionEndDate: moment().add(100, 'years').endOf('day').toDate(),
    //         subscriptionPrice: 0,
    //         subscriptionAmountPaid: 0,
    //         discount: 0,
    //         corporateUserId: 1,
    //         packageId: 1
    //     }, { transaction });
       
    //     // expect(accountCreatedSuccessTemplate).toHaveBeenCalledWith(requestData.name, requestData.username, requestData.email);
    //     // expect(emailer.email).toHaveBeenCalledWith(requestData.email, 'Congrats! Account created successfully!', 'emailBody');
    //     expect(result).toEqual({ user: { id: 1 }, details: { id: 1 } });
    // });

    it('should handle errors and rollback transaction', async () => {
        // Mock data
        const params = { id: 1 };
        const requestData = {
            password: 'REDACTED',
            mobileNo: '1234567890',
            email: 'test@example.com',
            website: 'example.com',
            contactPersonEmail: 'contact@example.com',
            contactPersonNumber: '9876543210',
            acs_user_id: 'acs123',
            registeredBy: 'partnerId'
        };
        const accessCodeData = { id: 2, groupId: 3 };

        // Mock models to throw an error
        credential.hashPassword.mockResolvedValue('hashedNewPassword123');
        credential.create.mockRejectedValue(new Error('DB Error'));
        wallet.create.mockResolvedValue(true);
        Package.findOne.mockResolvedValue({ id: 1 });
        corporateUser.create.mockResolvedValue({ id: 1 });
        Subscription.create.mockResolvedValue(true);
       
        jest.spyOn(require('../../../../utils/emailTemplate/signUp'), 'accountCreatedSuccessTemplate').mockResolvedValue('emailBody');
        emailer.email.mockResolvedValue(true);

        // Call function
        const result = await Update(params, requestData, accessCodeData);

        // Assertions
        expect(transaction.rollback).toHaveBeenCalled();
        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
