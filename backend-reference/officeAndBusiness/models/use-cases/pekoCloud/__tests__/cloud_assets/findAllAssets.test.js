const { Op } = require("sequelize");
const cloud_assets = require("../../../../entities/pekoCloud/cloud_assets");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const { findAllAssets } = require("../../cloud_assets");

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

const handleSortFields = jest.fn().mockReturnValue([['createdAt', 'DESC']]);

describe('findAllAssets Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return assets with pagination, sorting, and search text', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'createdAt';
        const sort = 'DESC';
        const searchText = 'Test';
        const credentialId = null;
        const subCorporateUserId = null;
        const assetsData = {
            count: 2,
            rows: [
                { id: 1, assetName: 'Test Asset 1' },
                { id: 2, assetName: 'Test Asset 2' },
            ],
        };

        cloud_assets.findAndCountAll.mockResolvedValue(assetsData);
        handleSortFields.mockReturnValue([[sortField, sort]]);

        const result = await findAllAssets(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

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
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { assetName: { [Op.like]: `%${searchText}%` } },
                    { serialNumber: { [Op.like]: `%${searchText}%` } },
                    { assetCategory: { [Op.like]: `%${searchText}%` } },
                    { assetType: { [Op.like]: `%${searchText}%` } },
                    { "$cloud_employee.employeeName$": { [Op.like]: `%${searchText}%` } },
                ],
            },
        });

        expect(result).toEqual({
            success: true,
            data: assetsData,
        });
    });

    it('should return assets with pagination and sorting only', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'createdAt';
        const sort = 'DESC';
        const searchText = "";
        const credentialId = null;
        const subCorporateUserId = null;
        const assetsData = {
            count: 3,
            rows: [
                { id: 1, assetName: 'Asset 1' },
                { id: 2, assetName: 'Asset 2' },
                { id: 3, assetName: 'Asset 3' },
            ],
        };

        cloud_assets.findAndCountAll.mockResolvedValue(assetsData);
        handleSortFields.mockReturnValue([[sortField, sort]]);

        const result = await findAllAssets(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

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
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {},
        });

        expect(result).toEqual({
            success: true,
            data: assetsData,
        });
    });

    it('should return assets filtered by search text only', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = "";
        const sort = "";
        const searchText = 'Test';
        const credentialId = null;
        const subCorporateUserId = null;
        const assetsData = {
            count: 2,
            rows: [
                { id: 1, assetName: 'Test Asset 1' },
                { id: 2, assetName: 'Test Asset 2' },
            ],
        };

        cloud_assets.findAndCountAll.mockResolvedValue(assetsData);

        const result = await findAllAssets(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

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
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { assetName: { [Op.like]: `%${searchText}%` } },
                    { serialNumber: { [Op.like]: `%${searchText}%` } },
                    { assetCategory: { [Op.like]: `%${searchText}%` } },
                    { assetType: { [Op.like]: `%${searchText}%` } },
                    { "$cloud_employee.employeeName$": { [Op.like]: `%${searchText}%` } },
                ],
            },
        });

        expect(result).toEqual({
            success: true,
            data: assetsData,
        });
    });

    it('should return assets filtered by credentialId only', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = "";
        const sort = "";
        const searchText = "";
        const credentialId = 1;
        const subCorporateUserId = null;
        const assetsData = {
            count: 2,
            rows: [
                { id: 1, assetName: 'Asset 1' },
                { id: 2, assetName: 'Asset 2' },
            ],
        };

        cloud_assets.findAndCountAll.mockResolvedValue(assetsData);

        const result = await findAllAssets(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

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
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: { credentialId },
        });

        expect(result).toEqual({
            success: true,
            data: assetsData,
        });
    });

    it('should return assets filtered by subCorporateUserId only', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = "";
        const sort = "";
        const searchText = "";
        const credentialId = null;
        const subCorporateUserId = 2;
        const assetsData = {
            count: 1,
            rows: [
                { id: 3, assetName: 'Asset 3' },
            ],
        };

        cloud_assets.findAndCountAll.mockResolvedValue(assetsData);

        const result = await findAllAssets(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

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
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: { subCorporateUserId },
        });

        expect(result).toEqual({
            success: true,
            data: assetsData,
        });
    });

    it('should return empty result if no assets found', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'createdAt';
        const sort = 'DESC';
        const searchText = 'Nonexistent';
        const credentialId = null;
        const subCorporateUserId = null;
        const assetsData = {
            count: 0,
            rows: [],
        };

        cloud_assets.findAndCountAll.mockResolvedValue(assetsData);
        handleSortFields.mockReturnValue([[sortField, sort]]);

        const result = await findAllAssets(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

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
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { assetName: { [Op.like]: `%${searchText}%` } },
                    { serialNumber: { [Op.like]: `%${searchText}%` } },
                    { assetCategory: { [Op.like]: `%${searchText}%` } },
                    { assetType: { [Op.like]: `%${searchText}%` } },
                    { "$cloud_employee.employeeName$": { [Op.like]: `%${searchText}%` } },
                ],
            },
        });

        expect(result).toEqual({
            success: true,
            data: assetsData,
        });
    });

    it('should handle invalid pagination parameters gracefully', async () => {
        const page = -1; // Invalid page number
        const itemsPerPage = 0; // Invalid items per page
        const sortField = "";
        const sort = "";
        const searchText = "";
        const credentialId = null;
        const subCorporateUserId = null;
        const assetsData = {
            count: 0,
            rows: [],
        };

        cloud_assets.findAndCountAll.mockResolvedValue(assetsData);

        const result = await findAllAssets(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

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
            limit: Math.max(itemsPerPage, 0),
            offset: Math.max((page - 1) * itemsPerPage, -0),
            order: [[sortField, sort]],
            where: {},
        });

        expect(result).toEqual({
            success: true,
            data: assetsData,
        });
    });
});
