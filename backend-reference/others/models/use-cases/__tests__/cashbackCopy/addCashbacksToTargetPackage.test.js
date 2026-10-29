const cashback = require('../../../entities/cashback');
const pkgModel = require('../../../entities/package');
const sequelizeConfig = require('../../../../configs/database/index');
const { addCashbacksToTargetPackage } = require('../../cashbackCopy');

jest.mock('../../../../configs/database/index', () => ({
    transaction: jest.fn(),
}));
jest.mock('../../../entities/cashback', () => ({
    findAll: jest.fn(),
    bulkCreate: jest.fn(),
}));
jest.mock('../../../entities/package', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/serviceOperator', () => ({}));

let transaction;

describe('addCashbacksToTargetPackage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        transaction = { commit: jest.fn(), rollback: jest.fn() };
        sequelizeConfig.transaction.mockResolvedValue(transaction);
    });

    it('rejects when toPackageId is missing', async () => {
        await expect(
            addCashbacksToTargetPackage({ sourceCashbackIds: [1] })
        ).rejects.toThrow('toPackageId is required');
        expect(sequelizeConfig.transaction).not.toHaveBeenCalled();
    });

    it('rejects when sourceCashbackIds is empty', async () => {
        await expect(
            addCashbacksToTargetPackage({ toPackageId: 5, sourceCashbackIds: [] })
        ).rejects.toThrow('sourceCashbackIds must be a non-empty array');
        expect(sequelizeConfig.transaction).not.toHaveBeenCalled();
    });

    it('rolls back and rethrows when the target package does not exist', async () => {
        pkgModel.findOne.mockResolvedValue(null);

        await expect(
            addCashbacksToTargetPackage({ toPackageId: 5, sourceCashbackIds: [1] })
        ).rejects.toThrow('Target package 5 not found');
        expect(transaction.rollback).toHaveBeenCalled();
        expect(transaction.commit).not.toHaveBeenCalled();
    });

    it('re-points copied cashbacks at the target package and drops id and timestamps', async () => {
        pkgModel.findOne.mockResolvedValue({ id: 5 });
        cashback.findAll
            .mockResolvedValueOnce([
                {
                    id: 1,
                    packageId: 9,
                    serviceOperatorId: 3,
                    cashback: '5',
                    createdAt: 'c',
                    updatedAt: 'u',
                },
            ])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ id: 100, packageId: 5, serviceOperatorId: 3 }]);
        cashback.bulkCreate.mockResolvedValue([{ id: 100 }]);

        const result = await addCashbacksToTargetPackage({
            toPackageId: 5,
            sourceCashbackIds: [1],
        });

        const [rows] = cashback.bulkCreate.mock.calls[0];
        expect(rows).toHaveLength(1);
        expect(rows[0]).not.toHaveProperty('id');
        expect(rows[0]).not.toHaveProperty('createdAt');
        expect(rows[0]).not.toHaveProperty('updatedAt');
        expect(rows[0].packageId).toBe(5);
        expect(transaction.commit).toHaveBeenCalled();
        expect(result.createdCount).toBe(1);
        expect(result.skippedDuplicates).toEqual([]);
    });

    it('skips sources whose service operator already exists on the target package', async () => {
        pkgModel.findOne.mockResolvedValue({ id: 5 });
        cashback.findAll
            .mockResolvedValueOnce([
                { id: 1, serviceOperatorId: 3 },
                { id: 2, serviceOperatorId: 4 },
            ])
            .mockResolvedValueOnce([{ serviceOperatorId: 3 }])
            .mockResolvedValueOnce([{ id: 101, serviceOperatorId: 4 }]);
        cashback.bulkCreate.mockResolvedValue([{ id: 101 }]);

        const result = await addCashbacksToTargetPackage({
            toPackageId: 5,
            sourceCashbackIds: [1, 2],
        });

        expect(cashback.bulkCreate.mock.calls[0][0]).toHaveLength(1);
        expect(cashback.bulkCreate.mock.calls[0][0][0].serviceOperatorId).toBe(4);
        expect(result.skippedDuplicates).toEqual([{ sourceCashbackId: 1, serviceOperatorId: 3 }]);
    });

    it('skips a second source row that repeats a service operator within the same request', async () => {
        pkgModel.findOne.mockResolvedValue({ id: 5 });
        cashback.findAll
            .mockResolvedValueOnce([
                { id: 1, serviceOperatorId: 3 },
                { id: 2, serviceOperatorId: 3 },
            ])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ id: 102, serviceOperatorId: 3 }]);
        cashback.bulkCreate.mockResolvedValue([{ id: 102 }]);

        const result = await addCashbacksToTargetPackage({
            toPackageId: 5,
            sourceCashbackIds: [1, 2],
        });

        expect(cashback.bulkCreate.mock.calls[0][0]).toHaveLength(1);
        expect(result.skippedDuplicates).toEqual([{ sourceCashbackId: 2, serviceOperatorId: 3 }]);
    });

    it('commits without inserting when every source row is a duplicate', async () => {
        pkgModel.findOne.mockResolvedValue({ id: 5 });
        cashback.findAll
            .mockResolvedValueOnce([{ id: 1, serviceOperatorId: 3 }])
            .mockResolvedValueOnce([{ serviceOperatorId: 3 }]);

        const result = await addCashbacksToTargetPackage({
            toPackageId: 5,
            sourceCashbackIds: [1],
        });

        expect(cashback.bulkCreate).not.toHaveBeenCalled();
        expect(transaction.commit).toHaveBeenCalled();
        expect(result).toEqual({
            created: [],
            createdCount: 0,
            skippedDuplicates: [{ sourceCashbackId: 1, serviceOperatorId: 3 }],
        });
    });

    it('rolls back and rethrows when the insert fails', async () => {
        pkgModel.findOne.mockResolvedValue({ id: 5 });
        cashback.findAll
            .mockResolvedValueOnce([{ id: 1, serviceOperatorId: 3 }])
            .mockResolvedValueOnce([]);
        cashback.bulkCreate.mockRejectedValue(new Error('insert failed'));

        await expect(
            addCashbacksToTargetPackage({ toPackageId: 5, sourceCashbackIds: [1] })
        ).rejects.toThrow('insert failed');
        expect(transaction.rollback).toHaveBeenCalled();
        expect(transaction.commit).not.toHaveBeenCalled();
    });
});
