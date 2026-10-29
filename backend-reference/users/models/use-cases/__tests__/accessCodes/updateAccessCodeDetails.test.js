const { updateAccessCodeDetails } = require('../../../use-cases/access_codes');
const access_codes = require('../../../entities/access_codes');
const credential = require('../../../entities/credential');
const sequelizeConfig = require('../../../../configs/database/index');

jest.mock('../../../entities/access_codes', () => ({
    update: jest.fn(),
}));
jest.mock('../../../entities/credential', () => ({
    update: jest.fn(),
}));

describe('access_codes - updateAccessCodeDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    it('should update access code details successfully', async () => {
        const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
        sequelizeConfig.transaction.mockResolvedValue(mockTransaction);
        access_codes.update.mockResolvedValue([1]);
        credential.update.mockResolvedValue([1]);

        const params = { id: 1, groupId: null };
        const data = { partnerId: 5, credentialId: 10 };

        const result = await updateAccessCodeDetails(params, data);

        expect(access_codes.update).toHaveBeenCalledWith(data, {
            where: expect.anything(),
            transaction: mockTransaction,
        });
        expect(credential.update).toHaveBeenCalledWith(
            { registeredBy: 5 },
            { where: { id: 10 }, transaction: mockTransaction }
        );
        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(result).toEqual([1]);
    });

    it('should update other codes in same group when groupId is provided', async () => {
        const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
        sequelizeConfig.transaction.mockResolvedValue(mockTransaction);
        access_codes.update.mockResolvedValue([1]);
        credential.update.mockResolvedValue([1]);

        const params = { id: 1, groupId: 5 };
        const data = { partnerId: 5, credentialId: 10 };

        await updateAccessCodeDetails(params, data);

        // Should be called twice: once for the target code, once for others in the group
        expect(access_codes.update).toHaveBeenCalledTimes(2);
        expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should rollback and return null on error', async () => {
        const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
        sequelizeConfig.transaction.mockResolvedValue(mockTransaction);
        access_codes.update.mockRejectedValue(new Error('DB error'));

        const result = await updateAccessCodeDetails({ id: 1 }, {});

        expect(mockTransaction.rollback).toHaveBeenCalled();
        expect(result).toBeNull();
    });
});
