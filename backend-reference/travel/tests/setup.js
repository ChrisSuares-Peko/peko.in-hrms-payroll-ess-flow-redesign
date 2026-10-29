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
            count: jest.fn(),
            prototype: {
                getResetPasswordToken: jest.fn(),
                validatePassword: jest.fn(),
            },
            belongsTo: jest.fn(),
            hasMany: jest.fn(),
            // Add any other methods your models use
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
    }),
    authenticate: jest.fn(),
}));
jest.mock('../utils/loggerHelper',()=>({
    customLog: jest.fn()
}))
jest.mock('../utils/logger',()=>({
    info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}))

