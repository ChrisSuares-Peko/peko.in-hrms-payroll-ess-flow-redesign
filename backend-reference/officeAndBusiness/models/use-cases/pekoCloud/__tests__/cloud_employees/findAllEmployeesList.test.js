const { findAllEmployeesList } = require("../../cloud_employees");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const cloud_assets = require("../../../../entities/pekoCloud/cloud_assets");
const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const cloud_subscriptions = require("../../../../entities/pekoCloud/cloud_subscriptions");
const ErrorResponse = require("../../../../../utils/error-response");

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

describe('findAllEmployeesList Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully retrieve employees with credential ID', async () => {
        const credentialId = 1;
        const subCorporateUserId = null;

        const employeesData = [
            { id: 1, employeeName: 'John Doe', dataValues: { id: 1, employeeName: 'John Doe' } },
        ];
        const assetsData = [
            { id: 1, assetName: 'Laptop', cloudEmployeeId: 1, amount: '1000', amountRecurring: 'Monthly' },
        ];
        const fleetData = [];
        const subscriptionsData = [
            { id: 1, amount: 600, assignTo: [{ id: 1 }] },
        ];

        cloud_employees.findAll.mockResolvedValue(employeesData);
        cloud_assets.findAll.mockResolvedValue(assetsData);
        cloud_fleets.findAll.mockResolvedValue(fleetData);
        cloud_subscriptions.findAll.mockResolvedValue(subscriptionsData);

        const result = await findAllEmployeesList(credentialId, subCorporateUserId);

        expect(cloud_employees.findAll).toHaveBeenCalledWith({
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
                        subscriptions: [
                            {
                                id: 1,
                                amount: 600,
                                assignTo: [{ id: 1 }],
                            },
                        ],
                        totalSpent: 1600,
                    },
                ],
                totalData: 1,
            },
        });
    });

    it('should successfully retrieve employees with subCorporateUser ID', async () => {
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

        const result = await findAllEmployeesList(credentialId, subCorporateUserId);

        expect(cloud_employees.findAll).toHaveBeenCalledWith({
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

    it('should successfully retrieve employees with both credential ID and subCorporateUser ID', async () => {
        const credentialId = 1;
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

        const result = await findAllEmployeesList(credentialId, subCorporateUserId);

        expect(cloud_employees.findAll).toHaveBeenCalledWith({
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

    it('should handle empty results', async () => {
        const credentialId = 1;
        const subCorporateUserId = 2;

        cloud_employees.findAll.mockResolvedValue([]);
        cloud_assets.findAll.mockResolvedValue([]);
        cloud_fleets.findAll.mockResolvedValue([]);
        cloud_subscriptions.findAll.mockResolvedValue([]);

        const result = await findAllEmployeesList(credentialId, subCorporateUserId);

        expect(result).toEqual({
            success: true,
            data: {
                result: [],
                totalData: 0,
            },
        });
    });

    it('should handle unexpected errors', async () => {
        const credentialId = 1;
        const subCorporateUserId = null;

        cloud_employees.findAll.mockRejectedValue(new Error('Database error'));

        const result = await findAllEmployeesList(credentialId, subCorporateUserId);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
