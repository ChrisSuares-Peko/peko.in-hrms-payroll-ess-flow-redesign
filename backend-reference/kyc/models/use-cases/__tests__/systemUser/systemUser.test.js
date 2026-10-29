const systemUserUseCase = require('../../systemUser');
const systemUser = require('../../../entities/systemUser');
const credential = require('../../../entities/credential');
const wallet = require('../../../entities/wallet');
const sequelizeConfig = require('../../../../configs/database/index');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('create', () => {
    it('should create a system user with credential and wallet in a transaction', async () => {
        const mockTransaction = {
            commit: jest.fn(),
            rollback: jest.fn()
        };
        sequelizeConfig.transaction.mockResolvedValue(mockTransaction);

        const mockCredential = {
            id: 1,
            getResetPasswordToken: jest.fn().mockReturnValue({
                resetPasswordToken: 'REDACTED',
                resetPasswordExpire: Date.now() + 600000
            })
        };
        credential.create.mockResolvedValue(mockCredential);
        wallet.create.mockResolvedValue({ id: 1 });
        systemUser.create.mockResolvedValue({ id: 1, credentialId: 1 });
        credential.update.mockResolvedValue([1]);

        const mockReq = {
            protocol: 'http',
            get: jest.fn().mockReturnValue('localhost:4444')
        };

        const result = await systemUserUseCase.create(
            { email: 'admin@test.com', name: 'Admin' },
            mockReq
        );
        expect(result).toEqual({ id: 1, credentialId: 1 });
        expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
        const mockTransaction = {
            commit: jest.fn(),
            rollback: jest.fn()
        };
        sequelizeConfig.transaction.mockResolvedValue(mockTransaction);
        credential.create.mockRejectedValue(new Error('DB Error'));

        const result = await systemUserUseCase.create({ email: 'admin@test.com' }, {});
        expect(result).toBe(false);
        expect(mockTransaction.rollback).toHaveBeenCalled();
    });
});

describe('findOne', () => {
    it('should find a system user by credentialId', async () => {
        const mockResult = { id: 1, credentialId: 1 };
        systemUser.findOne.mockResolvedValue(mockResult);

        const result = await systemUserUseCase.findOne({ id: 1 });
        expect(result).toEqual(mockResult);
        expect(systemUser.findOne).toHaveBeenCalledWith({ where: { credentialId: 1 } });
    });
});

describe('find', () => {
    it('should find a system user by email', async () => {
        const mockResult = { id: 1, email: 'admin@test.com' };
        systemUser.findOne.mockResolvedValue(mockResult);

        const result = await systemUserUseCase.find({ email: 'admin@test.com' });
        expect(result).toEqual(mockResult);
    });
});

describe('findAll', () => {
    it('should find all system users by id', async () => {
        const mockResult = [{ id: 1 }];
        systemUser.findAll.mockResolvedValue(mockResult);

        const result = await systemUserUseCase.findAll({ id: 1 });
        expect(result).toEqual(mockResult);
    });
});

describe('update', () => {
    it('should update credential and system user in a transaction', async () => {
        const mockTransaction = {
            commit: jest.fn(),
            rollback: jest.fn()
        };
        sequelizeConfig.transaction.mockResolvedValue(mockTransaction);
        credential.update.mockResolvedValue([1]);
        systemUser.update.mockResolvedValue([1]);

        const result = await systemUserUseCase.update({ id: 1 }, { name: 'Updated' });
        expect(result).toBe(true);
        expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should rollback on error and return false', async () => {
        const mockTransaction = {
            commit: jest.fn(),
            rollback: jest.fn()
        };
        sequelizeConfig.transaction.mockResolvedValue(mockTransaction);
        credential.update.mockRejectedValue(new Error('DB Error'));

        const result = await systemUserUseCase.update({ id: 1 }, { name: 'Updated' });
        expect(result).toBe(false);
        expect(mockTransaction.rollback).toHaveBeenCalled();
    });
});

describe('deleteOne', () => {
    it('should delete a system user', async () => {
        systemUser.destroy.mockResolvedValue(1);

        const result = await systemUserUseCase.deleteOne({ id: 1 });
        expect(result).toBe(1);
    });
});

describe('updateStatus', () => {
    it('should update system user status', async () => {
        systemUser.update.mockResolvedValue([1]);

        const mockReq = { params: { id: 1 }, body: { isActive: true } };
        const result = await systemUserUseCase.updateStatus(mockReq, {}, jest.fn());
        expect(result).toEqual([1]);
    });
});

describe('findAllAndCount', () => {
    it('should find all system users with pagination', async () => {
        const mockData = { count: 1, rows: [{ id: 1, credentialId: 1 }] };
        systemUser.findAndCountAll.mockResolvedValue(mockData);
        wallet.findAll.mockResolvedValue([{ credentialId: 1, balance: 100 }]);

        const result = await systemUserUseCase.findAllAndCount({
            start: 0, length: 10, draw: 1, searchText: '',
            order: 'ASC', column: 0, userId: 99
        });
        expect(result.count).toBe(1);
    });
});

describe('excelCsvData', () => {
    it('should format system user data for CSV', async () => {
        systemUser.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{
                id: 1,
                credentialId: 1,
                credential: { username: 'admin1', name: 'Admin', role: 'ADMIN' },
                email: 'admin@test.com',
                isActive: 1
            }]
        });
        wallet.findAll.mockResolvedValue([]);

        const result = await systemUserUseCase.excelCsvData({
            order: 'DESC', column: 'createdAt', userId: 99
        });
        expect(result[0]['username']).toBe('admin1');
        expect(result[0]['Status']).toBe('True');
    });
});
