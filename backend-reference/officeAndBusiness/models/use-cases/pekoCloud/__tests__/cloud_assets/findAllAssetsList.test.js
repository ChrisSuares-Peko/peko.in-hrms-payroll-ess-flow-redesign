const cloud_assets = require("../../../../entities/pekoCloud/cloud_assets");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const { findAllAssetsList } = require("../../cloud_assets");


jest.mock('../../../../entities/pekoCloud/cloud_assets.js', () => ({
    belongsTo: jest.fn(),
    findAndCountAll: jest.fn(),
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


describe('findAllAssetsList Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return assets filtered by credentialId', async () => {
        const credentialId = 1;
        const assetsData = {
            count: 2,
            rows: [
                { id: 1, assetName: 'Asset 1' },
                { id: 2, assetName: 'Asset 2' },
            ],
        };

        cloud_assets.findAndCountAll.mockResolvedValue(assetsData);

        const result = await findAllAssetsList(credentialId, null);

        expect(cloud_assets.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: cloud_employees,
                    attributes: [
                        "id",
                        "employeeName",
                        "employeeEmail",
                        "department",
                        "joiningDate",
                        "employeeID",
                    ],
                },
            ],
            where: { credentialId },
        });

        expect(result).toEqual({
            success: true,
            data: assetsData,
        });
    });

    it('should return assets filtered by subCorporateUserId', async () => {
        const subCorporateUserId = 2;
        const assetsData = {
            count: 1,
            rows: [
                { id: 3, assetName: 'Asset 3' },
            ],
        };

        cloud_assets.findAndCountAll.mockResolvedValue(assetsData);

        const result = await findAllAssetsList(null, subCorporateUserId);

        expect(cloud_assets.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: cloud_employees,
                    attributes: [
                        "id",
                        "employeeName",
                        "employeeEmail",
                        "department",
                        "joiningDate",
                        "employeeID",
                    ],
                },
            ],
            where: { subCorporateUserId },
        });

        expect(result).toEqual({
            success: true,
            data: assetsData,
        });
    });

    it('should return all assets when no filters are provided', async () => {
        const assetsData = {
            count: 3,
            rows: [
                { id: 1, assetName: 'Asset 1' },
                { id: 2, assetName: 'Asset 2' },
                { id: 3, assetName: 'Asset 3' },
            ],
        };

        cloud_assets.findAndCountAll.mockResolvedValue(assetsData);

        const result = await findAllAssetsList(null, null);

        expect(cloud_assets.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: cloud_employees,
                    attributes: [
                        "id",
                        "employeeName",
                        "employeeEmail",
                        "department",
                        "joiningDate",
                        "employeeID",
                    ],
                },
            ],
            where: {},
        });

        expect(result).toEqual({
            success: true,
            data: assetsData,
        });
    });

    it('should return empty result if no assets found', async () => {
        const credentialId = 1;
        const assetsData = {
            count: 0,
            rows: [],
        };

        cloud_assets.findAndCountAll.mockResolvedValue(assetsData);

        const result = await findAllAssetsList(credentialId, null);

        expect(cloud_assets.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: cloud_employees,
                    attributes: [
                        "id",
                        "employeeName",
                        "employeeEmail",
                        "department",
                        "joiningDate",
                        "employeeID",
                    ],
                },
            ],
            where: { credentialId },
        });

        expect(result).toEqual({
            success: true,
            data: assetsData,
        });
    });
});
