const sequelize = require('../../../../configs/database/index');
const credential = require('../../../entities/credential');
const wallet = require('../../../entities/wallet');
const corporateUser = require('../../../entities/corporateUser');
const { create } = require('../../corporateUser');

jest.mock('../../../../configs/database/index', () => ({
    define: jest.fn(() => ({})),
    transaction: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({
    create: jest.fn(),
}));

jest.mock('../../../entities/wallet', () => ({
    create: jest.fn(),
}));

jest.mock('../../../entities/corporateUser', () => ({
    create: jest.fn(),
}));


describe('CorporateUser › create', () => {
    let mockTransaction;

    beforeEach(() => {
        mockTransaction = {
            commit: jest.fn(),
            rollback: jest.fn(),
        };

        sequelize.transaction.mockResolvedValue(mockTransaction);
        jest.clearAllMocks();
    });

    it('should create credential, wallet and corporate user and commit transaction', async () => {
        const params = {
            name: 'John Doe',
            email: 'john@example.com',
        };

        const mockCredential = { id: 10 };
        const mockUser = { id: 1, name: 'John Doe' };

        credential.create.mockResolvedValue(mockCredential);
        wallet.create.mockResolvedValue({});
        corporateUser.create.mockResolvedValue(mockUser);

        const result = await create(params);

        expect(sequelize.transaction).toHaveBeenCalled();

        expect(credential.create).toHaveBeenCalledWith(
            params,
            { transaction: mockTransaction }
        );

        expect(wallet.create).toHaveBeenCalledWith(
            { credentialId: mockCredential.id },
            { transaction: mockTransaction }
        );

        expect(corporateUser.create).toHaveBeenCalledWith(
            {
                ...params,
                credentialId: mockCredential.id,
            },
            { transaction: mockTransaction }
        );

        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(mockTransaction.rollback).not.toHaveBeenCalled();

        expect(result).toEqual(mockUser);
    });

    it('should rollback transaction and return null when an error occurs', async () => {
        const params = {
            name: 'John Doe',
            email: 'john@example.com',
        };

        credential.create.mockRejectedValue(
            new Error('DB error')
        );

        const result = await create(params);

        expect(sequelize.transaction).toHaveBeenCalled();
        expect(mockTransaction.rollback).toHaveBeenCalled();
        expect(mockTransaction.commit).not.toHaveBeenCalled();
        expect(result).toBeNull();
    });

    it('should return null if corporateUser.create fails', async () => {
        const params = {
            name: 'John Doe',
            email: 'john@example.com',
        };

        credential.create.mockResolvedValue({ id: 5 });
        wallet.create.mockResolvedValue({});
        corporateUser.create.mockRejectedValue(
            new Error('User creation failed')
        );

        const result = await create(params);

        expect(mockTransaction.rollback).toHaveBeenCalled();
        expect(result).toBeNull();
    });
});
