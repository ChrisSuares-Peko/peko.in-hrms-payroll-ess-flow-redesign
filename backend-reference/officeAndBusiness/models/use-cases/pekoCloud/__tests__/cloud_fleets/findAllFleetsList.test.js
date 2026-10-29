const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const { findAllFleetsList } = require("../../cloud_fleets");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_fleets', () => ({
    belongsTo: jest.fn(),
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_employees', () => ({
    belongsTo: jest.fn(),
}));

describe('findAllFleetsList Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully retrieve fleets with credentialId filter', async () => {
        const credentialId = 1;
        const fleetsData = {
            count: 2,
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

        const result = await findAllFleetsList(credentialId);

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
            where: {
                credentialId: credentialId
            }
        });

        expect(result).toEqual({ success: true, data: fleetsData });
    });

    it('should successfully retrieve fleets with subCorporateUserId filter', async () => {
        const subCorporateUserId = 2;
        const fleetsData = {
            count: 1,
            rows: [
                {
                    id: 3,
                    vehicleName: 'Vehicle 3',
                    vehicleNumber: '11223',
                    subCorporateUserId: 2,
                    cloud_employee: {
                        id: 3,
                        employeeName: 'Jim Doe',
                        employeeEmail: 'jim.doe@example.com',
                        department: 'Finance',
                        joiningDate: new Date(),
                        employeeID: 'E125'
                    }
                }
            ]
        };

        cloud_fleets.findAndCountAll.mockResolvedValue(fleetsData);

        const result = await findAllFleetsList(null, subCorporateUserId);

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
            where: {
                subCorporateUserId: subCorporateUserId
            }
        });

        expect(result).toEqual({ success: true, data: fleetsData });
    });

    it('should successfully retrieve fleets without filters', async () => {
        const fleetsData = {
            count: 3,
            rows: [
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
                },
                {
                    id: 5,
                    vehicleName: 'Vehicle 5',
                    vehicleNumber: '55667',
                    cloud_employee: {
                        id: 5,
                        employeeName: 'Bob Brown',
                        employeeEmail: 'bob.brown@example.com',
                        department: 'Sales',
                        joiningDate: new Date(),
                        employeeID: 'E127'
                    }
                }
            ]
        };

        cloud_fleets.findAndCountAll.mockResolvedValue(fleetsData);

        const result = await findAllFleetsList();

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
            where: {}
        });

        expect(result).toEqual({ success: true, data: fleetsData });
    });

    it('should handle errors during database query', async () => {
        cloud_fleets.findAndCountAll.mockRejectedValue(new Error('Database error'));

        const result = await findAllFleetsList();

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
