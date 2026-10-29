const { Op } = require("sequelize");
const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const { findAllFleets } = require("../../cloud_fleets");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_fleets', () => ({
    belongsTo: jest.fn(),
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_employees', () => ({
    belongsTo: jest.fn(),
}));

describe('findAllFleets Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully retrieve fleets with pagination, sorting, and search text', async () => {
        const page = 1;
        const itemsPerPage = 2;
        const sortField = 'vehicleName';
        const sort = 'ASC';
        const searchText = 'Vehicle';
        const credentialId = 1;
        const subCorporateUserId = null;

        const offset = (page - 1) * itemsPerPage;
        const fleetsData = {
            count: 3,
            rows: [
                {
                    id: 1,
                    vehicleName: 'Vehicle 1',
                    vehicleNumber: '12345',
                    credentialId: 1,
                    cloud_employee: {
                        id: 1,
                        employeeName: 'John Doe',
                        employeeEmail: 'john.doe@example.com',
                        department: 'Engineering',
                        joiningDate: new Date(),
                        employeeID: 'E123'
                    }
                },
                {
                    id: 2,
                    vehicleName: 'Vehicle 2',
                    vehicleNumber: '67890',
                    credentialId: 1,
                    cloud_employee: {
                        id: 2,
                        employeeName: 'Jane Doe',
                        employeeEmail: 'jane.doe@example.com',
                        department: 'HR',
                        joiningDate: new Date(),
                        employeeID: 'E124'
                    }
                }
            ]
        };

        cloud_fleets.findAndCountAll.mockResolvedValue(fleetsData);

        const result = await findAllFleets(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

        expect(cloud_fleets.findAndCountAll).toHaveBeenCalledWith({
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
            offset: offset,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { vehicleName: { [Op.like]: `%${searchText}%` } },
                    { vehicleNumber: { [Op.like]: `%${searchText}%` } },
                    { vehicleType: { [Op.like]: `%${searchText}%` } },
                    { assetType: { [Op.like]: `%${searchText}%` } },
                    { modelYear: { [Op.like]: `%${searchText}%` } },
                    { "$cloud_employee.employeeName$": { [Op.like]: `%${searchText}%` } },
                ],
                credentialId: credentialId
            }
        });

        expect(result).toEqual({ success: true, data: fleetsData });
    });

    it('should successfully retrieve fleets with pagination and sorting only', async () => {
        const page = 1;
        const itemsPerPage = 2;
        const sortField = 'vehicleName';
        const sort = 'DESC';
        const searchText = "";
        const credentialId = null;
        const subCorporateUserId = null;

        const offset = (page - 1) * itemsPerPage;
        const fleetsData = {
            count: 3,
            rows: [
                {
                    id: 3,
                    vehicleName: 'Vehicle 3',
                    vehicleNumber: '11223',
                    cloud_employee: {
                        id: 3,
                        employeeName: 'Jim Doe',
                        employeeEmail: 'jim.doe@example.com',
                        department: 'Finance',
                        joiningDate: new Date(),
                        employeeID: 'E125'
                    }
                },
                {
                    id: 4,
                    vehicleName: 'Vehicle 4',
                    vehicleNumber: '33445',
                    cloud_employee: {
                        id: 4,
                        employeeName: 'Alice Smith',
                        employeeEmail: 'alice.smith@example.com',
                        department: 'Marketing',
                        joiningDate: new Date(),
                        employeeID: 'E126'
                    }
                }
            ]
        };

        cloud_fleets.findAndCountAll.mockResolvedValue(fleetsData);

        const result = await findAllFleets(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

        expect(cloud_fleets.findAndCountAll).toHaveBeenCalledWith({
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
            offset: offset,
            order: [[sortField, sort]],
            where: {}
        });

        expect(result).toEqual({ success: true, data: fleetsData });
    });

    it('should successfully retrieve fleets with filters', async () => {
        const page = 1;
        const itemsPerPage = 2;
        const sortField = 'vehicleNumber';
        const sort = 'ASC';
        const searchText = "";
        const credentialId = 2;
        const subCorporateUserId = null;

        const offset = (page - 1) * itemsPerPage;
        const fleetsData = {
            count: 2,
            rows: [
                {
                    id: 5,
                    vehicleName: 'Vehicle 5',
                    vehicleNumber: '55667',
                    credentialId: 2,
                    cloud_employee: {
                        id: 5,
                        employeeName: 'Bob Brown',
                        employeeEmail: 'bob.brown@example.com',
                        department: 'Sales',
                        joiningDate: new Date(),
                        employeeID: 'E127'
                    }
                },
                {
                    id: 6,
                    vehicleName: 'Vehicle 6',
                    vehicleNumber: '66778',
                    credentialId: 2,
                    cloud_employee: {
                        id: 6,
                        employeeName: 'Charlie Black',
                        employeeEmail: 'charlie.black@example.com',
                        department: 'Operations',
                        joiningDate: new Date(),
                        employeeID: 'E128'
                    }
                }
            ]
        };

        cloud_fleets.findAndCountAll.mockResolvedValue(fleetsData);

        const result = await findAllFleets(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

        expect(cloud_fleets.findAndCountAll).toHaveBeenCalledWith({
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
            offset: offset,
            order: [[sortField, sort]],
            where: {
                credentialId: credentialId
            }
        });

        expect(result).toEqual({ success: true, data: fleetsData });
    });

    it('should successfully retrieve fleets without filters', async () => {
        const page = 1;
        const itemsPerPage = 2;
        const sortField = 'vehicleName';
        const sort = 'ASC';
        const searchText = "";
        const credentialId = null;
        const subCorporateUserId = null;

        const offset = (page - 1) * itemsPerPage;
        const fleetsData = {
            count: 4,
            rows: [
                {
                    id: 7,
                    vehicleName: 'Vehicle 7',
                    vehicleNumber: '77889',
                    cloud_employee: {
                        id: 7,
                        employeeName: 'Diana Prince',
                        employeeEmail: 'diana.prince@example.com',
                        department: 'Legal',
                        joiningDate: new Date(),
                        employeeID: 'E129'
                    }
                },
                {
                    id: 8,
                    vehicleName: 'Vehicle 8',
                    vehicleNumber: '88990',
                    cloud_employee: {
                        id: 8,
                        employeeName: 'Evan Thomas',
                        employeeEmail: 'evan.thomas@example.com',
                        department: 'IT',
                        joiningDate: new Date(),
                        employeeID: 'E130'
                    }
                }
            ]
        };

        cloud_fleets.findAndCountAll.mockResolvedValue(fleetsData);

        const result = await findAllFleets(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

        expect(cloud_fleets.findAndCountAll).toHaveBeenCalledWith({
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
            offset: offset,
            order: [[sortField, sort]],
            where: {}
        });

        expect(result).toEqual({ success: true, data: fleetsData });
    });

    it('should handle errors during database query', async () => {
        const page = 1;
        const itemsPerPage = 2;
        const sortField = 'vehicleName';
        const sort = 'ASC';
        const searchText = "";
        const credentialId = null;
        const subCorporateUserId = null;

        cloud_fleets.findAndCountAll.mockRejectedValue(new Error('Database error'));

        const result = await findAllFleets(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
