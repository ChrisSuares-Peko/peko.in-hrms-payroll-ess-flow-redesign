const { create } = require('../../../use-cases/access_codes');
const access_codes = require('../../../entities/access_codes');
const sequelizeConfig = require('../../../../configs/database/index');

jest.mock('../../../entities/access_codes', () => ({
    create: jest.fn(),
}));

describe('access_codes - create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    it('should create an access code successfully', async () => {
        const mockParams = { access_code: 'TEST123', partnerId: 1 };
        const mockResult = { id: 1, ...mockParams };
        const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

        sequelizeConfig.transaction.mockResolvedValue(mockTransaction);
        access_codes.create.mockResolvedValue(mockResult);

        const result = await create(mockParams);

        expect(access_codes.create).toHaveBeenCalledWith(mockParams, { transaction: mockTransaction });
        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it('should return false when creation returns null', async () => {
        const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
        sequelizeConfig.transaction.mockResolvedValue(mockTransaction);
        access_codes.create.mockResolvedValue(null);

        const result = await create({});

        expect(result).toBe(false);
    });

    it('should rollback and return false on error', async () => {
        const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
        sequelizeConfig.transaction.mockResolvedValue(mockTransaction);
        access_codes.create.mockRejectedValue(new Error('DB error'));

        const result = await create({});

        expect(mockTransaction.rollback).toHaveBeenCalled();
        expect(result).toBe(false);
    });
});
