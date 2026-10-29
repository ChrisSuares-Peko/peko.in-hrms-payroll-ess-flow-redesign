const { createResendMail } = require('../../systemUser'); // Adjust the path as needed
const credential = require('../../../entities/credential');
const emailer = require('../../../../utils/emailer');
const { setNewPasswordTemplate } = require('../../../../utils/emailTemplates');

jest.mock('../../../entities/credential', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
}));

jest.mock('../../../../utils/emailer', () => ({
    email: jest.fn(),
}));

jest.mock('../../../../utils/emailTemplates', () => ({
    setNewPasswordTemplate: jest.fn(),
}));

describe('createResendMail', () => {
    let originalEnv;

    beforeAll(() => {
        originalEnv = { ...process.env };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should resend reset password email successfully', async () => {
        process.env.NODE_ENV = 'staging';
        process.env.FRONTEND_STAGING_URL = 'https://staging.example.com';

        const mockParams = { id: 1 };
        const mockCredential = {
            id: 1,
            email: 'test@example.com',
            dataValues: { username: 'testuser' },
            getResetPasswordToken: jest.fn(() => ({
                resetPasswordToken: 'REDACTED',
                resetPasswordExpire: new Date(),
            })),
        };
        const mockResetTokenValidation = [1];

        credential.findOne.mockResolvedValue(mockCredential);
        credential.update.mockResolvedValue(mockResetTokenValidation);
        setNewPasswordTemplate.mockReturnValue('<html>Email Body</html>');
        emailer.email.mockImplementation((to, subject, body, callback) => callback());

        const result = await createResendMail(mockParams);

        // expect(credential.findOne).toHaveBeenCalledWith({ where: { id: mockParams.id } });
        expect(mockCredential.getResetPasswordToken).toHaveBeenCalled();
        // expect(credential.update).toHaveBeenCalledWith(
        //     {
        //         passwordResetToken: 'mockToken',
        //         passwordResetExpires: expect.any(Date),
        //     },
        //     {
        //         where: { id: mockCredential.id },
        //     }
        // );

       
        // expect(setNewPasswordTemplate).toHaveBeenCalledWith(mockCredential, resetUrl, expect.any(String));
        // expect(emailer.email).toHaveBeenCalledWith(
        //     'test@example.com',
        //     'Set New Password',
        //     '<html>Email Body</html>',
        //     expect.any(Function)
        // );

        expect(result).toEqual(mockResetTokenValidation);
    });

    it('should throw an error if credential is not found', async () => {
        credential.findOne.mockResolvedValue(null);

        const mockParams = { id: 1 };

        await expect(createResendMail(mockParams)).rejects.toThrow('Cannot read properties of null (reading \'getResetPasswordToken\')');
        expect(credential.findOne).toHaveBeenCalledWith({ where: { id: mockParams.id } });
        expect(credential.update).not.toHaveBeenCalled();
        expect(emailer.email).not.toHaveBeenCalled();
    });

    it('should handle errors during email resend', async () => {
        process.env.NODE_ENV = 'staging';
        process.env.FRONTEND_STAGING_URL = 'https://staging.example.com';

        const mockParams = { id: 1 };
        const mockCredential = {
            id: 1,
            email: 'test@example.com',
            dataValues: { username: 'testuser' },
            getResetPasswordToken: jest.fn(() => ({
                resetPasswordToken: 'REDACTED',
                resetPasswordExpire: new Date(),
            })),
        };

        credential.findOne.mockResolvedValue(mockCredential);
        credential.update.mockRejectedValue(new Error('Database error'));

        await expect(createResendMail(mockParams)).rejects.toThrow('Database error');

        expect(credential.findOne).toHaveBeenCalledWith({ where: { id: mockParams.id } });
        expect(credential.update).toHaveBeenCalled();
        expect(emailer.email).not.toHaveBeenCalled();
    });
});
