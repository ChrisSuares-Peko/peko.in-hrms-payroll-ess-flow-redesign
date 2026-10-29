const { Op } = require("sequelize");
const cloud_assets = require("../../../../entities/pekoCloud/cloud_assets");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const cloud_usageHistories = require("../../../../entities/pekoCloud/cloud_usageHistories");
const { findAllAssetsUsageHistories } = require("../../cloud_assets");

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
    findAndCountAll: jest.fn(),
}));

const handleSortFields = jest.fn().mockReturnValue([['createdAt', 'DESC']]);

describe('findAllAssetsUsageHistories Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return usage histories with pagination, sorting, and search text', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'createdAt';
        const sort = 'DESC';
        const searchText = 'Test';
        const credentialId = null;
        const usageHistoriesData = {
            count: 2,
            rows: [
                { id: 1, usageDetail: 'Detail 1' },
                { id: 2, usageDetail: 'Detail 2' },
            ],
        };

        cloud_usageHistories.findAndCountAll.mockResolvedValue(usageHistoriesData);
        handleSortFields.mockReturnValue([[sortField, sort]]);

        const result = await findAllAssetsUsageHistories(page, itemsPerPage, sortField, sort, searchText, credentialId);

        expect(cloud_usageHistories.findAndCountAll).toHaveBeenCalledWith({
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
                {
                    model: cloud_assets,
                    attributes: [
                        "id",
                        "assetName",
                        "assetCategory",
                        "serialNumber",
                        "purchasedDate",
                        "assetType",
                        "warranty",
                        "amount",
                    ],
                },
            ],
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { "$cloud_employee.employeeName$": { [Op.like]: `%${searchText}%` } },
                    { "$cloud_employee.employeeEmail$": { [Op.like]: `%${searchText}%` } },
                    { "$cloud_employee.department$": { [Op.like]: `%${searchText}%` } },
                ],
                usageCategory: "ASSET"
            },
        });

        expect(result).toEqual({
            success: true,
            data: usageHistoriesData,
        });
    });

    it('should return usage histories with pagination and sorting only', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'createdAt';
        const sort = 'DESC';
        const searchText = "";
        const credentialId = null;
        const usageHistoriesData = {
            count: 3,
            rows: [
                { id: 1, usageDetail: 'Detail 1' },
                { id: 2, usageDetail: 'Detail 2' },
                { id: 3, usageDetail: 'Detail 3' },
            ],
        };

        cloud_usageHistories.findAndCountAll.mockResolvedValue(usageHistoriesData);
        handleSortFields.mockReturnValue([[sortField, sort]]);

        const result = await findAllAssetsUsageHistories(page, itemsPerPage, sortField, sort, searchText, credentialId);

        expect(cloud_usageHistories.findAndCountAll).toHaveBeenCalledWith({
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
                {
                    model: cloud_assets,
                    attributes: [
                        "id",
                        "assetName",
                        "assetCategory",
                        "serialNumber",
                        "purchasedDate",
                        "assetType",
                        "warranty",
                        "amount",
                    ],
                },
            ],
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                usageCategory: "ASSET"
            },
        });

        expect(result).toEqual({
            success: true,
            data: usageHistoriesData,
        });
    });

    it('should return usage histories filtered by search text only', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = "";
        const sort = "";
        const searchText = 'Test';
        const credentialId = null;
        const usageHistoriesData = {
            count: 2,
            rows: [
                { id: 1, usageDetail: 'Detail 1' },
                { id: 2, usageDetail: 'Detail 2' },
            ],
        };

        cloud_usageHistories.findAndCountAll.mockResolvedValue(usageHistoriesData);

        const result = await findAllAssetsUsageHistories(page, itemsPerPage, sortField, sort, searchText, credentialId);

        expect(cloud_usageHistories.findAndCountAll).toHaveBeenCalledWith({
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
                {
                    model: cloud_assets,
                    attributes: [
                        "id",
                        "assetName",
                        "assetCategory",
                        "serialNumber",
                        "purchasedDate",
                        "assetType",
                        "warranty",
                        "amount",
                    ],
                },
            ],
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { "$cloud_employee.employeeName$": { [Op.like]: `%${searchText}%` } },
                    { "$cloud_employee.employeeEmail$": { [Op.like]: `%${searchText}%` } },
                    { "$cloud_employee.department$": { [Op.like]: `%${searchText}%` } },
                ],
                usageCategory: "ASSET"
            },
        });

        expect(result).toEqual({
            success: true,
            data: usageHistoriesData,
        });
    });

    it('should return usage histories filtered by credentialId only', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = "";
        const sort = "";
        const searchText = "";
        const credentialId = 1;
        const usageHistoriesData = {
            count: 2,
            rows: [
                { id: 1, usageDetail: 'Detail 1' },
                { id: 2, usageDetail: 'Detail 2' },
            ],
        };

        cloud_usageHistories.findAndCountAll.mockResolvedValue(usageHistoriesData);

        const result = await findAllAssetsUsageHistories(page, itemsPerPage, sortField, sort, searchText, credentialId);

        expect(cloud_usageHistories.findAndCountAll).toHaveBeenCalledWith({
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
                {
                    model: cloud_assets,
                    attributes: [
                        "id",
                        "assetName",
                        "assetCategory",
                        "serialNumber",
                        "purchasedDate",
                        "assetType",
                        "warranty",
                        "amount",
                    ],
                },
            ],
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                credentialId,
                usageCategory: "ASSET"
            },
        });

        expect(result).toEqual({
            success: true,
            data: usageHistoriesData,
        });
    });

    it('should return empty result if no usage histories found', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'createdAt';
        const sort = 'DESC';
        const searchText = 'Nonexistent';
        const credentialId = null;
        const usageHistoriesData = {
            count: 0,
            rows: [],
        };

        cloud_usageHistories.findAndCountAll.mockResolvedValue(usageHistoriesData);
        handleSortFields.mockReturnValue([[sortField, sort]]);

        const result = await findAllAssetsUsageHistories(page, itemsPerPage, sortField, sort, searchText, credentialId);

        expect(cloud_usageHistories.findAndCountAll).toHaveBeenCalledWith({
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
                {
                    model: cloud_assets,
                    attributes: [
                        "id",
                        "assetName",
                        "assetCategory",
                        "serialNumber",
                        "purchasedDate",
                        "assetType",
                        "warranty",
                        "amount",
                    ],
                },
            ],
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { "$cloud_employee.employeeName$": { [Op.like]: `%${searchText}%` } },
                    { "$cloud_employee.employeeEmail$": { [Op.like]: `%${searchText}%` } },
                    { "$cloud_employee.department$": { [Op.like]: `%${searchText}%` } },
                ],
                usageCategory: "ASSET"
            },
        });

        expect(result).toEqual({
            success: true,
            data: usageHistoriesData,
        });
    });

    it('should handle invalid pagination parameters gracefully', async () => {
        const page = -1;
        const itemsPerPage = 0;
        const sortField = 'createdAt';
        const sort = 'DESC';
        const searchText = '';
        const credentialId = null;

        cloud_usageHistories.findAndCountAll.mockResolvedValue({
            count: 0,
            rows: [],
        });
        handleSortFields.mockReturnValue([[sortField, sort]]);

        const result = await findAllAssetsUsageHistories(page, itemsPerPage, sortField, sort, searchText, credentialId);

        expect(cloud_usageHistories.findAndCountAll).toHaveBeenCalledWith({
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
                {
                    model: cloud_assets,
                    attributes: [
                        "id",
                        "assetName",
                        "assetCategory",
                        "serialNumber",
                        "purchasedDate",
                        "assetType",
                        "warranty",
                        "amount",
                    ],
                },
            ],
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                usageCategory: "ASSET"
            },
        });

        expect(result).toEqual({
            success: true,
            data: {
                count: 0,
                rows: [],
            },
        });
    });

    it('should handle no sort fields', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = '';
        const sort = '';
        const searchText = '';
        const credentialId = null;
        const usageHistoriesData = {
            count: 3,
            rows: [
                { id: 1, usageDetail: 'Detail 1' },
                { id: 2, usageDetail: 'Detail 2' },
                { id: 3, usageDetail: 'Detail 3' },
            ],
        };

        cloud_usageHistories.findAndCountAll.mockResolvedValue(usageHistoriesData);
        handleSortFields.mockReturnValue([]);

        const result = await findAllAssetsUsageHistories(page, itemsPerPage, sortField, sort, searchText, credentialId);

        expect(cloud_usageHistories.findAndCountAll).toHaveBeenCalledWith({
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
                {
                    model: cloud_assets,
                    attributes: [
                        "id",
                        "assetName",
                        "assetCategory",
                        "serialNumber",
                        "purchasedDate",
                        "assetType",
                        "warranty",
                        "amount",
                    ],
                },
            ],
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                usageCategory: "ASSET"
            },
        });

        expect(result).toEqual({
            success: true,
            data: usageHistoriesData,
        });
    });
});
