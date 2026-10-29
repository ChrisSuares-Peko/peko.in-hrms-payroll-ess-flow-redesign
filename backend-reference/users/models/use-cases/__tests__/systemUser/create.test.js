const { create } = require('../../../use-cases/systemUser');
const systemUser = require('../../../entities/systemUser');
const credential = require('../../../entities/credential');
const wallet = require('../../../entities/wallet');
const sequelizeConfig = require('../../../../configs/database/index');

jest.mock('../../../entities/systemUser', () => ({
    create: jest.fn(),
}));
jest.mock('../../../entities/credential', () => ({
    create: jest.fn(),
    update: jest.fn(),
}));
jest.mock('../../../entities/wallet', () => ({
    create: jest.fn(),
}));
jest.mock('../../../../utils/emailer', () => ({
    email: jest.fn(),
}));
jest.mock('../../../../utils/emailTemplates', () => ({
    setNewPasswordTemplate: jest.fn().mockReturnValue('<html>Reset</html>'),
}));

describe('systemUser - create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
        console.log.mockRestore();
    });

    it('should create a system user with credential and wallet', async () => {
        const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
        sequelizeConfig.transaction.mockResolvedValue(mockTransaction);

        const mockCredential = {
            id: 1,
            getResetPasswordToken: jest.fn().mockReturnValue({
                resetPasswordToken: 'REDACTED',
                resetPasswordExpire: new Date(),
            }),
        };
        credential.create.mockResolvedValue(mockCredential);
        wallet.create.mockResolvedValue({});
        systemUser.create.mockResolvedValue({ id: 1, credentialId: 1 });

        const params = { email: 'test@test.com', name: 'Test User' };
        const req = { protocol: 'http', get: jest.fn().mockReturnValue('localhost') };

        const result = await create(params, req);

        expect(credential.create).toHaveBeenCalledWith(params, { transaction: mockTransaction });
        expect(wallet.create).toHaveBeenCalledWith({ credentialId: 1 }, { transaction: mockTransaction });
        expect(systemUser.create).toHaveBeenCalled();
        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(result).toEqual({ id: 1, credentialId: 1 });
    });

    it('should rollback on error and return ErrorResponse', async () => {
        const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
        sequelizeConfig.transaction.mockResolvedValue(mockTransaction);
        credential.create.mockRejectedValue(new Error('DB error'));

        const params = { email: 'test@test.com' };
        const req = { protocol: 'http', get: jest.fn().mockReturnValue('localhost') };

        const result = await create(params, req);

        expect(mockTransaction.rollback).toHaveBeenCalled();
        expect(result).toBeDefined();
        expect(result.message).toBe('Something went wrong, please try again later.');
    });
});
