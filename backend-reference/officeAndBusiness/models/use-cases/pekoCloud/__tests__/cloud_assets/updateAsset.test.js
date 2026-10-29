const cloud_assets = require("../../../../entities/pekoCloud/cloud_assets");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const { updateAsset } = require("../../cloud_assets");

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
}));

describe('updateAsset Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully update the asset when asset and employee exist', async () => {
        const id = 1;
        const newData = { cloudEmployeeId: 2, assetName: 'Updated Asset' };

        cloud_assets.findOne.mockResolvedValue({ id });
        cloud_employees.findOne.mockResolvedValue({ id: 2 });
        cloud_assets.update.mockResolvedValue([1]); // Indicates that one row was updated

        const result = await updateAsset(id, newData);

        expect(cloud_assets.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id: newData.cloudEmployeeId } });
        expect(cloud_assets.update).toHaveBeenCalledWith(newData, { where: { id } });

        expect(result).toEqual({ success: true, data: {} });
    });

    it('should return error if asset does not exist', async () => {
        const id = 1;
        const newData = { cloudEmployeeId: 2 };

        cloud_assets.findOne.mockResolvedValue(null); // Asset does not exist

        const result = await updateAsset(id, newData);

        expect(cloud_assets.findOne).toHaveBeenCalledWith({ where: { id } });

        expect(result).toEqual({
            success: false,
            error: "asset is not existing with the given details",
        });
    });

    it('should return error if employee does not exist', async () => {
        const id = 1;
        const newData = { cloudEmployeeId: 2 };

        cloud_assets.findOne.mockResolvedValue({ id });
        cloud_employees.findOne.mockResolvedValue(null); // Employee does not exist

        const result = await updateAsset(id, newData);

        expect(cloud_assets.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id: newData.cloudEmployeeId } });

        expect(result).toEqual({
            success: false,
            error: "employee is not existing with the given details",
        });
    });

    it('should return error if update operation fails', async () => {
        const id = 1;
        const newData = { assetName: 'Updated Asset' };

        cloud_assets.findOne.mockResolvedValue({ id });
        cloud_assets.update.mockResolvedValue([0]); // Indicates that no rows were updated

        const result = await updateAsset(id, newData);

        expect(cloud_assets.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(cloud_assets.update).toHaveBeenCalledWith(newData, { where: { id } });

        expect(result).toEqual({
            success: false,
            error: "something went wrong while updating the asset",
        });
    });

    it('should handle case when employee ID is not provided in the update data', async () => {
        const id = 1;
        const newData = { assetName: 'Updated Asset' };

        cloud_assets.findOne.mockResolvedValue({ id });
        cloud_assets.update.mockResolvedValue([1]); // Indicates that one row was updated

        const result = await updateAsset(id, newData);

        expect(cloud_assets.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(cloud_assets.update).toHaveBeenCalledWith(newData, { where: { id } });

        expect(result).toEqual({ success: true, data: {} });
    });
});
