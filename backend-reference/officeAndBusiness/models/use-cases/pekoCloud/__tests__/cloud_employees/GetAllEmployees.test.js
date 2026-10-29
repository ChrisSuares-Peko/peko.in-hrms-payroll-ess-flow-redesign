const { GetAllEmployees } = require("../../cloud_employees");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const ErrorResponse = require("../../../../../utils/error-response");
const { Op } = require("sequelize");

jest.mock('../../../../entities/pekoCloud/cloud_employees', () => ({
    findAll: jest.fn(),
}));

describe('GetAllEmployees Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully retrieve employees without search text and credentialId', async () => {
        const searchText = '';
        const credentialId = null;

        const employeesData = [
            { id: 1, employeeName: 'John Doe', employeeID: 'E001', employeeEmail: 'john.doe@example.com', department: 'HR' },
            { id: 2, employeeName: 'Jane Smith', employeeID: 'E002', employeeEmail: 'jane.smith@example.com', department: 'IT' },
        ];

        cloud_employees.findAll.mockResolvedValue(employeesData);

        const result = await GetAllEmployees(searchText, credentialId);

        expect(cloud_employees.findAll).toHaveBeenCalledWith({
            where: {},
            attributes: [
                "id",
                "employeeName",
                "employeeID",
                "employeeEmail",
                "department",
            ],
        });
        expect(result).toEqual({
            success: true,
            data: { employeesData },
        });
    });

    it('should successfully retrieve employees with search text', async () => {
        const searchText = 'John';
        const credentialId = null;

        const employeesData = [
            { id: 1, employeeName: 'John Doe', employeeID: 'E001', employeeEmail: 'john.doe@example.com', department: 'HR' },
        ];

        cloud_employees.findAll.mockResolvedValue(employeesData);

        const result = await GetAllEmployees(searchText, credentialId);

        expect(cloud_employees.findAll).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { employeeName: { [Op.like]: `%${searchText}%` } },
                    { employeeID: { [Op.like]: `%${searchText}%` } },
                    { employeeEmail: { [Op.like]: `%${searchText}%` } },
                ],
            },
            attributes: [
                "id",
                "employeeName",
                "employeeID",
                "employeeEmail",
                "department",
            ],
        });
        expect(result).toEqual({
            success: true,
            data: { employeesData },
        });
    });

    it('should successfully retrieve employees with credentialId filter', async () => {
        const searchText = '';
        const credentialId = 1;

        const employeesData = [
            { id: 1, employeeName: 'John Doe', employeeID: 'E001', employeeEmail: 'john.doe@example.com', department: 'HR' },
        ];

        cloud_employees.findAll.mockResolvedValue(employeesData);

        const result = await GetAllEmployees(searchText, credentialId);

        expect(cloud_employees.findAll).toHaveBeenCalledWith({
            where: { credentialId },
            attributes: [
                "id",
                "employeeName",
                "employeeID",
                "employeeEmail",
                "department",
            ],
        });
        expect(result).toEqual({
            success: true,
            data: { employeesData },
        });
    });

    it('should handle case when no employees are found', async () => {
        const searchText = '';
        const credentialId = null;

        cloud_employees.findAll.mockResolvedValue([]);

        const result = await GetAllEmployees(searchText, credentialId);

        expect(result).toEqual({
            success: true,
            data: { employeesData: [] },
        });
    });

    it('should handle unexpected errors', async () => {
        const searchText = '';
        const credentialId = null;

        cloud_employees.findAll.mockRejectedValue(new Error('Database error'));

        const result = await GetAllEmployees(searchText, credentialId);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
