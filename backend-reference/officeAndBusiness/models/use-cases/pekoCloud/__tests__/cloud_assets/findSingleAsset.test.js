const cloud_assets = require("../../../../entities/pekoCloud/cloud_assets");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const { findSingleAsset } = require("../../cloud_assets");

jest.mock('../../../../entities/pekoCloud/cloud_assets.js', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
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

describe('findSingleAsset Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return asset with related employee data if asset exists', async () => {
        const assetId = 1;
        const assetData = {
            id: assetId,
            assetName: 'Test Asset',
            serialNumber: '12345',
            cloudEmployeeId: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
            cloud_employee: {
                id: 2,
                employeeName: 'John Doe',
                employeeEmail: 'john.doe@example.com',
                department: 'IT',
                joiningDate: new Date(),
                employeeID: 'EMP123'
            }
        };

        cloud_assets.findOne.mockResolvedValue(assetData);

        const result = await findSingleAsset(assetId);

        expect(cloud_assets.findOne).toHaveBeenCalledWith({
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
            where: { id: assetId },
        });

        expect(result).toEqual({
            success: true,
            data: assetData
        });
    });

    it('should return asset without related employee data if asset exists but has no related employee', async () => {
        const assetId = 1;
        const assetData = {
            id: assetId,
            assetName: 'Test Asset',
            serialNumber: '12345',
            cloudEmployeeId: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        cloud_assets.findOne.mockResolvedValue(assetData);

        const result = await findSingleAsset(assetId);

        expect(cloud_assets.findOne).toHaveBeenCalledWith({
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
            where: { id: assetId },
        });

        expect(result).toEqual({
            success: true,
            data: assetData
        });
    });

    it('should return error if asset does not exist', async () => {
        const assetId = 1;

        cloud_assets.findOne.mockResolvedValue(null);

        const result = await findSingleAsset(assetId);

        expect(cloud_assets.findOne).toHaveBeenCalledWith({
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
            where: { id: assetId },
        });

        expect(result).toEqual({
            success: false,
            error: "Asset with this details doesn't exists."
        });
    });
});
