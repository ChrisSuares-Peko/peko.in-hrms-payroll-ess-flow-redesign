jest.mock('../configs/database/index', () => ({
    define: jest.fn().mockImplementation(() => ({
        findOne: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
        findAndCountAll: jest.fn(),
        count: jest.fn(),
        findByPk: jest.fn(),
        bulkCreate: jest.fn(),
        belongsTo: jest.fn(),
        hasOne: jest.fn(),
        hasMany: jest.fn(),
        belongsToMany: jest.fn(),
    })),
    sync: jest.fn(),
    transaction: jest.fn().mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn(),
    }),
    authenticate: jest.fn(),
    query: jest.fn(),
    QueryTypes: { SELECT: 'SELECT' },
}));

jest.mock('../utils/loggerHelper', () => ({
    customLog: jest.fn(),
}));

jest.mock('../utils/cacheDataMethods', () => ({
    getValue: jest.fn().mockResolvedValue(null),
    setValue: jest.fn().mockResolvedValue(undefined),
    deleteValue: jest.fn().mockResolvedValue(undefined),
    pushToList: jest.fn().mockResolvedValue(undefined),
    client: { on: jest.fn(), connect: jest.fn() },
}));

jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));
