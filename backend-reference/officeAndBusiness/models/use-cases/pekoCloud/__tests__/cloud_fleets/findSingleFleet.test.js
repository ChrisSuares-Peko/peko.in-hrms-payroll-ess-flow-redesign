const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const { findSingleFleet } = require("../../cloud_fleets");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_fleets', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_employees', () => ({
    belongsTo: jest.fn(),
}));

describe('findSingleFleet Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully retrieve a fleet and its associated employee', async () => {
        const id = 1;
        const fleetData = {
            id: 1,
            vehicleName: 'Test Vehicle',
            vehicleNumber: '12345',
            credentialId: 1,
            cloudEmployeeId: 2
        };
        const employeeData = {
            id: 2,
            employeeName: 'John Doe',
            employeeEmail: 'john.doe@example.com',
            department: 'Engineering',
            joiningDate: new Date(),
            employeeID: 'E123'
        };

        cloud_fleets.findOne.mockResolvedValue({
            ...fleetData,
            cloud_employee: employeeData
        });

        const result = await findSingleFleet(id);

        expect(cloud_fleets.findOne).toHaveBeenCalledWith({
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
                id: id,
            },
        });

        expect(result).toEqual({
            success: true,
            data: {
                ...fleetData,
                cloud_employee: employeeData
            }
        });
    });

    it('should return null if fleet does not exist', async () => {
        const id = 1;

        cloud_fleets.findOne.mockResolvedValue(null);

        const result = await findSingleFleet(id);

        expect(cloud_fleets.findOne).toHaveBeenCalledWith({
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
                id: id,
            },
        });

        expect(result).toEqual({
            success: true,
            data: null
        });
    });

    it('should handle errors during database query', async () => {
        const id = 1;

        cloud_fleets.findOne.mockRejectedValue(new Error('Database error'));

        const result = await findSingleFleet(id);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
