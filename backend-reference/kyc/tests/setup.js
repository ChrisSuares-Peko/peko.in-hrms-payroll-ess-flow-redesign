jest.mock('../configs/database/index', () => ({
    define: jest.fn().mockImplementation((modelName, attributes) => {
        const model = {
            ...attributes,
            findOne: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
            findAndCountAll: jest.fn(),
            findByPk: jest.fn(),
            sum: jest.fn(),
            count: jest.fn(),
            bulkCreate: jest.fn(),
            prototype: {
                getResetPasswordToken: jest.fn(),
                validatePassword: jest.fn(),
                validatePin: jest.fn(),
                validateEmail: jest.fn(),
                validateOtp: jest.fn(),
                save: jest.fn(),
            },
            belongsTo: jest.fn(),
            hasOne: jest.fn(),
            hasMany: jest.fn(),
            belongsToMany: jest.fn(),
            hashOtp: jest.fn(),
        };
        if (modelName === 'credential') {
            model.hashPassword = jest.fn();
        }
        return model;
    }),
    sync: jest.fn(),
    transaction: jest.fn().mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn(),
        LOCK: { UPDATE: 'UPDATE' },
    }),
    authenticate: jest.fn(),
    query: jest.fn(),
    QueryTypes: { SELECT: 'SELECT' },
}));

jest.mock('../utils/loggerHelper', () => ({
    customLog: jest.fn()
}));
jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));
jest.mock('../utils/emailer', () => ({
    email: jest.fn()
}));
jest.mock('../utils/emailTemplates', () => ({
    setNewPasswordTemplate: jest.fn().mockReturnValue('<html>Reset</html>'),
    passwordCreatedSuccessfullyTemplate: jest.fn().mockReturnValue('<html>Password</html>'),
    accountCreatedSuccessTemplate: jest.fn().mockReturnValue('<html>Account</html>'),
}));
jest.mock('../utils/commonUploadFile', () => ({
    uploadFile: jest.fn().mockResolvedValue('https://example.com/uploaded-file.png')
}));