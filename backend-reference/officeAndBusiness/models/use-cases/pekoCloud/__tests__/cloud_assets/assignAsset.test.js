const cloud_assets = require("../../../../entities/pekoCloud/cloud_assets");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const cloud_usageHistories = require("../../../../entities/pekoCloud/cloud_usageHistories");
const { assignAsset } = require("../../cloud_assets");
const sequelize = require('../../../../../configs/database/index');
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_assets.js', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_chequeBooks.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_documents.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_employees.js', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_fleets.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_maintenances.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_owners.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_softwares.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_subscriptions.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_usageHistories.js', () => ({
    belongsTo: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
}));

jest.mock('../../../../../utils/sortHandle.js', () => ({
    handleSortFields: jest.fn(),
}));

jest.mock('../../../../../configs/database/index', () => ({
    define: jest.fn(),
    transaction: jest.fn().mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn(),
    }),
}));

describe('assignAsset Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully assign the asset and update existing usage history', async () => {
        const newData = {
            newEmployeeId: 2,
            assetId: 1,
            newAssignDate: new Date(),
            existUsageId: 3,
            existReturnDate: new Date(),
            existReturnStatus: 'Returned',
            existRemarks: 'Returned in good condition'
        };
        const credentialId = '123';

        cloud_assets.findOne.mockResolvedValue({ id: 1, cloudEmployeeId: 2 });
        cloud_employees.findOne.mockResolvedValue({ id: 2 });
        cloud_usageHistories.update.mockResolvedValue([1]); // Indicates that one row was updated
        cloud_usageHistories.create.mockResolvedValue({ id: 4 });
        cloud_assets.update.mockResolvedValue([1]); // Indicates that one row was updated

        const result = await assignAsset(newData, credentialId);

        expect(cloud_assets.findOne).toHaveBeenCalledWith({ where: { id: newData.assetId, credentialId } });
        expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id: newData.newEmployeeId } });
        expect(cloud_usageHistories.update).toHaveBeenCalledWith(
            {
                returnDate: newData.existReturnDate,
                returnStatus: newData.existReturnStatus,
                remarks: newData.existRemarks,
            },
            {
                where: { id: newData.existUsageId },
                transaction: expect.any(Object),
            }
        );
        expect(cloud_usageHistories.create).toHaveBeenCalledWith(
            {
                cloudEmployeeId: newData.newEmployeeId,
                usageCategory: expect.any(String),
                cloudAssetId: newData.assetId,
                assignDate: newData.newAssignDate,
                credentialId: credentialId,
            },
            {
                transaction: expect.any(Object),
            }
        );
        expect(cloud_assets.update).toHaveBeenCalledWith(
            { cloudEmployeeId: newData.newEmployeeId },
            {
                where: { id: newData.assetId },
                transaction: expect.any(Object),
            }
        );
        expect(sequelize.transaction).toHaveBeenCalled();

        expect(result).toEqual({ success: true, data: {} });
    });

    it('should return error if asset does not exist', async () => {
        const newData = {
            newEmployeeId: 2,
            assetId: 1,
        };
        const credentialId = '123';

        cloud_assets.findOne.mockResolvedValue(null); // Asset does not exist

        const result = await assignAsset(newData, credentialId);

        expect(cloud_assets.findOne).toHaveBeenCalledWith({ where: { id: newData.assetId, credentialId } });
        expect(sequelize.transaction).toHaveBeenCalled();

        expect(result).toEqual({
            success: false,
            error: "asset is not existing with the given details",
        });
    });

    it('should return error if employee does not exist', async () => {
        const newData = {
            newEmployeeId: 2,
            assetId: 1,
        };
        const credentialId = '123';

        cloud_assets.findOne.mockResolvedValue({ id: 1 });
        cloud_employees.findOne.mockResolvedValue(null); // Employee does not exist

        const result = await assignAsset(newData, credentialId);

        expect(cloud_assets.findOne).toHaveBeenCalledWith({ where: { id: newData.assetId, credentialId } });
        expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id: newData.newEmployeeId } });
        expect(sequelize.transaction).toHaveBeenCalled();

        expect(result).toEqual({
            success: false,
            error: "employee is not existing with the given details",
        });
    });

    it('should handle failure in updating existing usage history', async () => {
        const newData = {
            newEmployeeId: 2,
            assetId: 1,
            existUsageId: 3,
            existReturnDate: new Date(),
            existReturnStatus: 'Returned',
            existRemarks: 'Returned in good condition'
        };
        const credentialId = '123';

        cloud_assets.findOne.mockResolvedValue({ id: 1, cloudEmployeeId: 2 });
        cloud_employees.findOne.mockResolvedValue({ id: 2 });
        cloud_usageHistories.update.mockRejectedValue(new Error("Failed to update usage history"));

        const result = await assignAsset(newData, credentialId);

        expect(cloud_assets.findOne).toHaveBeenCalledWith({ where: { id: newData.assetId, credentialId } });
        expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id: newData.newEmployeeId } });
        expect(cloud_usageHistories.update).toHaveBeenCalledWith(
            {
                returnDate: newData.existReturnDate,
                returnStatus: newData.existReturnStatus,
                remarks: newData.existRemarks,
            },
            {
                where: { id: newData.existUsageId },
                transaction: expect.any(Object),
            }
        );
        expect(sequelize.transaction).toHaveBeenCalled();

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle failure in creating new usage history', async () => {
        const newData = {
            newEmployeeId: 2,
            assetId: 1,
            newAssignDate: new Date(),
        };
        const credentialId = '123';

        cloud_assets.findOne.mockResolvedValue({ id: 1, cloudEmployeeId: 2 });
        cloud_employees.findOne.mockResolvedValue({ id: 2 });
        cloud_usageHistories.update.mockResolvedValue([1]);
        cloud_usageHistories.create.mockRejectedValue(new Error("Failed to create usage history"));

        const result = await assignAsset(newData, credentialId);

        expect(cloud_assets.findOne).toHaveBeenCalledWith({ where: { id: newData.assetId, credentialId } });
        expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id: newData.newEmployeeId } });
        expect(cloud_usageHistories.update).toHaveBeenCalledWith(
            {
                returnDate: newData.existReturnDate,
                returnStatus: newData.existReturnStatus,
                remarks: newData.existRemarks,
            },
            {
                where: { id: newData.existUsageId },
                transaction: expect.any(Object),
            }
        );
        expect(cloud_usageHistories.create).toHaveBeenCalledWith(
            {
                cloudEmployeeId: newData.newEmployeeId,
                usageCategory: expect.any(String),
                cloudAssetId: newData.assetId,
                assignDate: newData.newAssignDate,
                credentialId: credentialId,
            },
            {
                transaction: expect.any(Object),
            }
        );
        expect(sequelize.transaction).toHaveBeenCalled();

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });

    it('should handle failure in updating the asset', async () => {
        const newData = {
            newEmployeeId: 2,
            assetId: 1,
            newAssignDate: new Date(),
        };
        const credentialId = '123';

        cloud_assets.findOne.mockResolvedValue({ id: 1, cloudEmployeeId: 2 });
        cloud_employees.findOne.mockResolvedValue({ id: 2 });
        cloud_usageHistories.update.mockResolvedValue([1]);
        cloud_usageHistories.create.mockResolvedValue({ id: 4 });
        cloud_assets.update.mockResolvedValue([0]); // Indicates that no rows were updated

        const result = await assignAsset(newData, credentialId);

        expect(cloud_assets.findOne).toHaveBeenCalledWith({ where: { id: newData.assetId, credentialId } });
        expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id: newData.newEmployeeId } });
        expect(cloud_usageHistories.update).toHaveBeenCalledWith(
            {
                returnDate: newData.existReturnDate,
                returnStatus: newData.existReturnStatus,
                remarks: newData.existRemarks,
            },
            {
                where: { id: newData.existUsageId },
                transaction: expect.any(Object),
            }
        );
        expect(cloud_usageHistories.create).toHaveBeenCalledWith(
            {
                cloudEmployeeId: newData.newEmployeeId,
                usageCategory: expect.any(String),
                cloudAssetId: newData.assetId,
                assignDate: newData.newAssignDate,
                credentialId: credentialId,
            },
            {
                transaction: expect.any(Object),
            }
        );
        expect(cloud_assets.update).toHaveBeenCalledWith(
            { cloudEmployeeId: newData.newEmployeeId },
            {
                where: { id: newData.assetId },
                transaction: expect.any(Object),
            }
        );
        expect(sequelize.transaction).toHaveBeenCalled();

        expect(result).toEqual({
            success: false,
            error: "something went wrong while updating the asset",
        });
    });
});
