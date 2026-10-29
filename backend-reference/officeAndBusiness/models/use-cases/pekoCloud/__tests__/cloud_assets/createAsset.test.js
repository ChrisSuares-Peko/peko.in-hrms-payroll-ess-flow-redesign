const { Op } = require("sequelize");
const cloud_assets = require("../../../../entities/pekoCloud/cloud_assets");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const cloud_usageHistories = require("../../../../entities/pekoCloud/cloud_usageHistories");
const { createAsset } = require("../../cloud_assets");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_assets.js', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
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

describe('createAsset Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return error if asset already exists', async () => {
        const data = {
            // assetName: 'Test Asset',
            serialNumber: '12345',
            credentialId: 1
        };

        cloud_assets.findOne.mockResolvedValue({
            id: 1,
            assetName: 'Test Asset',
            serialNumber: '12345'
        });

        const result = await createAsset(data);

        expect(cloud_assets.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { assetName: data.assetName, serialNumber: data.serialNumber, credentialId: data.credentialId },
                ],
            },
        });

        expect(result).toEqual({ success: false, error: "Asset with this serial number already exists" });
    });

    it('should return error if employee does not exist', async () => {
        const data = {
            assetName: 'New Asset',
            serialNumber: '67890',
            credentialId: 1,
            cloudEmployeeId: 2
        };

        cloud_assets.findOne.mockResolvedValue(null);
        cloud_employees.findOne.mockResolvedValue(null);

        const result = await createAsset(data);

        expect(cloud_employees.findOne).toHaveBeenCalledWith({
            where: { id: data.cloudEmployeeId },
        });

        expect(result).toEqual({ success: false, error: "employee is not existing with the given details" });
    });

    it('should successfully create an asset and usage history', async () => {
        const data = {
            assetName: 'New Asset',
            serialNumber: '67890',
            credentialId: 1,
            cloudEmployeeId: 2
        };

        cloud_assets.findOne.mockResolvedValue(null);
        cloud_employees.findOne.mockResolvedValue({ id: 2 });
        cloud_assets.create.mockResolvedValue({ id: 1, ...data, createdAt: new Date() });
        cloud_usageHistories.create.mockResolvedValue({ id: 1 });

        const result = await createAsset(data);

        expect(cloud_assets.create).toHaveBeenCalledWith(data, { transaction: expect.any(Object) });
        expect(cloud_usageHistories.create).toHaveBeenCalledWith({
            cloudEmployeeId: data.cloudEmployeeId,
            usageCategory: 'ASSET',
            cloudAssetId: 1,
            assignDate: expect.any(Date),
            credentialId: data.credentialId
        }, { transaction: expect.any(Object) });

        expect(result).toEqual({ success: true, data: { id: 1, createdAt: expect.any(Date), ...data } });
    });

    it('should handle transaction rollback on failure', async () => {
        const data = {
            assetName: 'New Asset',
            serialNumber: '67890',
            credentialId: 1
        };

        cloud_assets.findOne.mockResolvedValue(null);
        cloud_employees.findOne.mockResolvedValue(null);
        cloud_assets.create.mockRejectedValue(new Error('Database error'));

        const result = await createAsset(data);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
