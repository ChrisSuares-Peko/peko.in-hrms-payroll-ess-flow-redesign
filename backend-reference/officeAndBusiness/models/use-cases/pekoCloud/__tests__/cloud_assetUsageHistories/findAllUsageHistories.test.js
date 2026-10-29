const cloud_usageHistories = require('../../../../entities/pekoCloud/cloud_usageHistories');
const cloud_employees = require('../../../../entities/pekoCloud/cloud_employees');
const ErrorResponse = require('../../../../../utils/error-response');
const { findAllUsageHistories } = require('../../cloud_assetUsageHistories');
const { Op } = require('sequelize');

jest.mock('../../../../entities/pekoCloud/cloud_assets.js', () => ({
    belongsTo: jest.fn(),
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

describe('findAllUsageHistories Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully fetch all usage histories with valid parameters', async () => {
        const mockUsageHistories = {
            count: 2,
            rows: [
                {
                    id: 1,
                    usageCategory: 'ASSET',
                    assignDate: new Date(),
                    returnDate: new Date(),
                    returnStatus: 'Returned',
                    remarks: 'Good condition',
                    cloud_employee: {
                        id: 1,
                        employeeName: 'John Doe',
                        employeeEmail: 'john.doe@example.com',
                        department: 'IT',
                    },
                },
                {
                    id: 2,
                    usageCategory: 'SOFTWARE',
                    assignDate: new Date(),
                    returnDate: new Date(),
                    returnStatus: 'Returned',
                    remarks: 'Good condition',
                    cloud_employee: {
                        id: 2,
                        employeeName: 'Jane Smith',
                        employeeEmail: 'jane.smith@example.com',
                        department: 'HR',
                    },
                },
            ],
        };

        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'assignDate';
        const sort = 'ASC';
        const searchText = 'John';
        const assetId = 1;

        cloud_usageHistories.findAndCountAll.mockResolvedValue(mockUsageHistories);

        const result = await findAllUsageHistories(page, itemsPerPage, sortField, sort, searchText, assetId);

        expect(cloud_usageHistories.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: cloud_employees,
                    attributes: ['id', 'employeeName', 'employeeEmail', 'department'],
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
                cloudAssetId: assetId,
                usageCategory: "ASSET",
            },
        });

        expect(result).toEqual({ success: true, data: mockUsageHistories });
    });

    it('should return success with empty data if no usage histories found', async () => {
        const mockUsageHistories = {
            count: 0,
            rows: [],
        };

        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'assignDate';
        const sort = 'ASC';
        const searchText = 'John';
        const assetId = 1;

        cloud_usageHistories.findAndCountAll.mockResolvedValue(mockUsageHistories);

        const result = await findAllUsageHistories(page, itemsPerPage, sortField, sort, searchText, assetId);

        expect(cloud_usageHistories.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: cloud_employees,
                    attributes: ['id', 'employeeName', 'employeeEmail', 'department'],
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
                cloudAssetId: assetId,
                usageCategory: "ASSET",
            },
        });

        expect(result).toEqual({ success: true, data: mockUsageHistories });
    });

    it('should handle database errors', async () => {
        cloud_usageHistories.findAndCountAll.mockRejectedValue(new Error('Database error'));

        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'assignDate';
        const sort = 'ASC';
        const searchText = 'John';
        const assetId = 1;

        const result = await findAllUsageHistories(page, itemsPerPage, sortField, sort, searchText, assetId);

        expect(cloud_usageHistories.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: cloud_employees,
                    attributes: ['id', 'employeeName', 'employeeEmail', 'department'],
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
                cloudAssetId: assetId,
                usageCategory: "ASSET",
            },
        });

        expect(result).toEqual(new ErrorResponse('Something went wrong, please try again later.', 500));
    });
});
