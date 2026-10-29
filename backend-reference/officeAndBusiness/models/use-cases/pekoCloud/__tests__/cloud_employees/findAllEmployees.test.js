const { findAllEmployees } = require("../../cloud_employees");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const cloud_assets = require("../../../../entities/pekoCloud/cloud_assets");
const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const cloud_subscriptions = require("../../../../entities/pekoCloud/cloud_subscriptions");
const ErrorResponse = require("../../../../../utils/error-response");
const { Op } = require("sequelize");

jest.mock('../../../../entities/pekoCloud/cloud_employees', () => ({
    findAll: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_assets', () => ({
    findAll: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_fleets', () => ({
    findAll: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_subscriptions', () => ({
    findAll: jest.fn(),
}));

describe('findAllEmployees Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully retrieve employees with pagination and sorting', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'employeeName';
        const sort = 'ASC';
        const searchText = '';
        const credentialId = 1;
        const subCorporateUserId = null;
    
        // Mocked data
        const employeesData = [
            { id: 1, employeeName: 'John Doe', dataValues: { id: 1, employeeName: 'John Doe' } },
            { id: 2, employeeName: 'Jane Smith', dataValues: { id: 2, employeeName: 'Jane Smith' } },
        ];
        const assetsData = [
            { id: 1, assetName: 'Laptop', cloudEmployeeId: 1, amount: '1000', amountRecurring: 'Monthly' },
            { id: 2, assetName: 'Monitor', cloudEmployeeId: 2, amount: '500', amountRecurring: 'One-time' },
        ];
        const fleetData = [
            { id: 1, vehicleName: 'Car', cloudEmployeeId: 1, amount: '2000', amountRecurring: 'Monthly' },
        ];
        const subscriptionsData = [
            { id: 1, amount: 600, assignTo: [{ id: 1 }], currency: 'USD' }, // Assigned only to John Doe
            { id: 2, amount: 600, assignTo: [{ id: 2 }], currency: 'USD' }, // Assigned only to Jane Smith
        ];

        process.env.USD_TO_INR = '3'; // Mocked USD-to-AED conversion rate

        cloud_employees.findAll.mockResolvedValue(employeesData);
        cloud_assets.findAll.mockResolvedValue(assetsData);
        cloud_fleets.findAll.mockResolvedValue(fleetData);
        cloud_subscriptions.findAll.mockResolvedValue(subscriptionsData);
    
        const result = await findAllEmployees(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);
    
        expect(cloud_employees.findAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: { credentialId },
        });
        expect(cloud_assets.findAll).toHaveBeenCalledWith({
            where: { credentialId },
            attributes: [
                "id",
                "assetName",
                "assetCategory",
                "serialNumber",
                "purchasedDate",
                "assetType",
                "amount",
                "amountRecurring",
                "cloudEmployeeId",
            ],
        });
        expect(cloud_fleets.findAll).toHaveBeenCalledWith({
            where: { credentialId },
            attributes: [
                "id",
                "vehicleName",
                "vehicleType",
                "vehicleNumber",
                "purchasedDate",
                "dateOfRenewal",
                "amount",
                "amountRecurring",
                "cloudEmployeeId",
            ],
        });
        expect(cloud_subscriptions.findAll).toHaveBeenCalledWith({
            where: { credentialId },
        });
    
        expect(result).toEqual({
            success: true,
            data: {
                result: [
                    {
                        id: 1,
                        employeeName: 'John Doe',
                        assetsAndFleet: [
                            { id: 1, assetName: 'Laptop', cloudEmployeeId: 1, amount: '1000', amountRecurring: 'Monthly' },
                            { id: 1, vehicleName: 'Car', cloudEmployeeId: 1, amount: '2000', amountRecurring: 'Monthly' },
                        ],
                        subscriptions: [
                            {
                                id: 1,
                                amount: 600,
                                assignTo: [{ id: 1 }],
                                currency: 'USD',
                            },
                        ],
                        totalSpent: 4800, // 1000 + 2000 + (600 * 3)
                    },
                    {
                        id: 2,
                        employeeName: 'Jane Smith',
                        assetsAndFleet: [
                            { id: 2, assetName: 'Monitor', cloudEmployeeId: 2, amount: '500', amountRecurring: 'One-time' },
                        ],
                        subscriptions: [
                            {
                                id: 2,
                                amount: 600,
                                assignTo: [{ id: 2 }],
                                currency: 'USD',
                            },
                        ],
                        totalSpent: 2300, // 500 + (600 * 3)
                    },
                ],
                totalData: 2,
            },
        });
    });
    
    

    it('should successfully retrieve employees with search text', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'employeeName';
        const sort = 'ASC';
        const searchText = 'John';
        const credentialId = 1;
        const subCorporateUserId = null;

        const employeesData = [
            { id: 1, employeeName: 'John Doe', dataValues: { id: 1, employeeName: 'John Doe' } },
        ];
        const assetsData = [];
        const fleetData = [];
        const subscriptionsData = [];

        cloud_employees.findAll.mockResolvedValue(employeesData);
        cloud_assets.findAll.mockResolvedValue(assetsData);
        cloud_fleets.findAll.mockResolvedValue(fleetData);
        cloud_subscriptions.findAll.mockResolvedValue(subscriptionsData);

        const result = await findAllEmployees(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

        expect(cloud_employees.findAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { employeeName: { [Op.like]: `%${searchText}%` } },
                    { employeeID: { [Op.like]: `%${searchText}%` } },
                    { employeeEmail: { [Op.like]: `%${searchText}%` } },
                ],
                credentialId,
            },
        });
        expect(cloud_assets.findAll).toHaveBeenCalledWith({
            where: { credentialId },
            attributes: [
                "id",
                "assetName",
                "assetCategory",
                "serialNumber",
                "purchasedDate",
                "assetType",
                "amount",
                "amountRecurring",
                "cloudEmployeeId",
            ],
        });
        expect(cloud_fleets.findAll).toHaveBeenCalledWith({
            where: { credentialId },
            attributes: [
                "id",
                "vehicleName",
                "vehicleType",
                "vehicleNumber",
                "purchasedDate",
                "dateOfRenewal",
                "amount",
                "amountRecurring",
                "cloudEmployeeId",
            ],
        });
        expect(cloud_subscriptions.findAll).toHaveBeenCalledWith({
            where: { credentialId },
        });

        expect(result).toEqual({
            success: true,
            data: {
                result: [
                    {
                        id: 1,
                        employeeName: 'John Doe',
                        assetsAndFleet: [],
                        subscriptions: [],
                        totalSpent: 0,
                    },
                ],
                totalData: 1,
            },
        });
    });

    it('should successfully retrieve employees with credentialId filter', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'employeeName';
        const sort = 'ASC';
        const searchText = '';
        const credentialId = 1;
        const subCorporateUserId = null;

        const employeesData = [
            { id: 1, employeeName: 'John Doe', dataValues: { id: 1, employeeName: 'John Doe' } },
        ];
        const assetsData = [
            { id: 1, assetName: 'Laptop', cloudEmployeeId: 1, amount: '1000', amountRecurring: 'Monthly' },
        ];
        const fleetData = [];
        const subscriptionsData = [];

        cloud_employees.findAll.mockResolvedValue(employeesData);
        cloud_assets.findAll.mockResolvedValue(assetsData);
        cloud_fleets.findAll.mockResolvedValue(fleetData);
        cloud_subscriptions.findAll.mockResolvedValue(subscriptionsData);

        const result = await findAllEmployees(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

        expect(cloud_employees.findAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: { credentialId },
        });
        expect(cloud_assets.findAll).toHaveBeenCalledWith({
            where: { credentialId },
            attributes: [
                "id",
                "assetName",
                "assetCategory",
                "serialNumber",
                "purchasedDate",
                "assetType",
                "amount",
                "amountRecurring",
                "cloudEmployeeId",
            ],
        });
        expect(cloud_fleets.findAll).toHaveBeenCalledWith({
            where: { credentialId },
            attributes: [
                "id",
                "vehicleName",
                "vehicleType",
                "vehicleNumber",
                "purchasedDate",
                "dateOfRenewal",
                "amount",
                "amountRecurring",
                "cloudEmployeeId",
            ],
        });
        expect(cloud_subscriptions.findAll).toHaveBeenCalledWith({
            where: { credentialId },
        });

        expect(result).toEqual({
            success: true,
            data: {
                result: [
                    {
                        id: 1,
                        employeeName: 'John Doe',
                        assetsAndFleet: [
                            { id: 1, assetName: 'Laptop', cloudEmployeeId: 1, amount: '1000', amountRecurring: 'Monthly' },
                        ],
                        subscriptions: [],
                        totalSpent: 1000,
                    },
                ],
                totalData: 1,
            },
        });
    });

    it('should successfully retrieve employees with subCorporateUserId filter', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'employeeName';
        const sort = 'ASC';
        const searchText = '';
        const credentialId = null;
        const subCorporateUserId = 2;

        const employeesData = [
            { id: 1, employeeName: 'John Doe', dataValues: { id: 1, employeeName: 'John Doe' } },
        ];
        const assetsData = [];
        const fleetData = [];
        const subscriptionsData = [];

        cloud_employees.findAll.mockResolvedValue(employeesData);
        cloud_assets.findAll.mockResolvedValue(assetsData);
        cloud_fleets.findAll.mockResolvedValue(fleetData);
        cloud_subscriptions.findAll.mockResolvedValue(subscriptionsData);

        const result = await findAllEmployees(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

        expect(cloud_employees.findAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: { subCorporateUserId },
        });
        expect(cloud_assets.findAll).toHaveBeenCalledWith({
            where: { credentialId },
            attributes: [
                "id",
                "assetName",
                "assetCategory",
                "serialNumber",
                "purchasedDate",
                "assetType",
                "amount",
                "amountRecurring",
                "cloudEmployeeId",
            ],
        });
        expect(cloud_fleets.findAll).toHaveBeenCalledWith({
            where: { credentialId },
            attributes: [
                "id",
                "vehicleName",
                "vehicleType",
                "vehicleNumber",
                "purchasedDate",
                "dateOfRenewal",
                "amount",
                "amountRecurring",
                "cloudEmployeeId",
            ],
        });
        expect(cloud_subscriptions.findAll).toHaveBeenCalledWith({
            where: { credentialId },
        });

        expect(result).toEqual({
            success: true,
            data: {
                result: [
                    {
                        id: 1,
                        employeeName: 'John Doe',
                        assetsAndFleet: [],
                        subscriptions: [],
                        totalSpent: 0,
                    },
                ],
                totalData: 1,
            },
        });
    });

    it('should handle case when no employees are found', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'employeeName';
        const sort = 'ASC';
        const searchText = '';
        const credentialId = 1;
        const subCorporateUserId = null;

        cloud_employees.findAll.mockResolvedValue([]);
        cloud_assets.findAll.mockResolvedValue([]);
        cloud_fleets.findAll.mockResolvedValue([]);
        cloud_subscriptions.findAll.mockResolvedValue([]);

        const result = await findAllEmployees(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

        expect(result).toEqual({
            success: true,
            data: {
                result: [],
                totalData: 0,
            },
        });
    });

    it('should handle unexpected errors', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'employeeName';
        const sort = 'ASC';
        const searchText = '';
        const credentialId = 1;
        const subCorporateUserId = null;

        cloud_employees.findAll.mockRejectedValue(new Error('Database error'));

        const result = await findAllEmployees(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
