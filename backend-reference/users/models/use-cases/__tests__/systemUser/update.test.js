const { update } = require('../../../use-cases/systemUser');
const systemUser = require('../../../entities/systemUser');
const credential = require('../../../entities/credential');
const sequelizeConfig = require('../../../../configs/database/index');

jest.mock('../../../entities/systemUser', () => ({
    update: jest.fn(),
}));
jest.mock('../../../entities/credential', () => ({
    update: jest.fn(),
}));

describe('systemUser - update', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update both credential and system user successfully', async () => {
        const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
        sequelizeConfig.transaction.mockResolvedValue(mockTransaction);
        credential.update.mockResolvedValue([1]);
        systemUser.update.mockResolvedValue([1]);

        const result = await update({ id: 1 }, { name: 'Updated' });

        expect(credential.update).toHaveBeenCalledWith(
            { name: 'Updated' },
            { where: { id: 1 }, transaction: mockTransaction }
        );
        expect(systemUser.update).toHaveBeenCalledWith(
            { name: 'Updated' },
            { where: { credentialId: 1 }, transaction: mockTransaction }
        );
        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    it('should rollback and return false on error', async () => {
        const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
        sequelizeConfig.transaction.mockResolvedValue(mockTransaction);
        credential.update.mockRejectedValue(new Error('DB error'));

        const result = await update({ id: 1 }, { name: 'Test' });

        expect(mockTransaction.rollback).toHaveBeenCalled();
        expect(result).toBe(false);
    });
});
