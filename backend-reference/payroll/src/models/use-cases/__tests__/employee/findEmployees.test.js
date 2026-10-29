const { findEmployees } = require('../../../use-cases/employee'); // Adjust the path accordingly
const Employee = require('../../../entities/employee'); // Adjust the path accordingly

jest.mock('../../../entities/employee');

describe('findEmployees', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return employees with populated department', async () => {
        const queryConditions = { isEmployeeDeleted: false };
        const sortCondition = { fullName: 1 };
        const skip = 0;
        const limit = 10;
        const mockEmployees = [
            {
                _id: 'employeeId1',
                fullName: 'John Doe',
                employeeInformation: {
                    department: { departmentName: 'Engineering' }
                }
            },
            {
                _id: 'employeeId2',
                fullName: 'Jane Smith',
                employeeInformation: {
                    department: { departmentName: 'HR' }
                }
            }
        ];

        const execMock = jest.fn().mockResolvedValue(mockEmployees);
        const limitMock = jest.fn().mockReturnValue({ exec: execMock });
        const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
        const sortMock = jest.fn().mockReturnValue({ skip: skipMock });
        const populateMock = jest.fn().mockReturnValue({ sort: sortMock });

        Employee.find.mockReturnValue({ populate: populateMock });

        const result = await findEmployees(queryConditions, sortCondition, skip, limit);

        expect(Employee.find).toHaveBeenCalledWith(queryConditions);
        expect(populateMock).toHaveBeenCalledWith({
            path: 'employeeInformation.department',
            select: 'departmentName'
        });
        expect(sortMock).toHaveBeenCalledWith(sortCondition);
        expect(skipMock).toHaveBeenCalledWith(skip);
        expect(limitMock).toHaveBeenCalledWith(limit);
        expect(execMock).toHaveBeenCalled();
        expect(result).toEqual(mockEmployees);
    });

    it('should return an empty array if no employees are found', async () => {
        const queryConditions = { isEmployeeDeleted: false };
        const sortCondition = { fullName: 1 };
        const skip = 0;
        const limit = 10;
        const mockEmployees = [];

        const execMock = jest.fn().mockResolvedValue(mockEmployees);
        const limitMock = jest.fn().mockReturnValue({ exec: execMock });
        const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
        const sortMock = jest.fn().mockReturnValue({ skip: skipMock });
        const populateMock = jest.fn().mockReturnValue({ sort: sortMock });

        Employee.find.mockReturnValue({ populate: populateMock });

        const result = await findEmployees(queryConditions, sortCondition, skip, limit);

        expect(Employee.find).toHaveBeenCalledWith(queryConditions);
        expect(populateMock).toHaveBeenCalledWith({
            path: 'employeeInformation.department',
            select: 'departmentName'
        });
        expect(sortMock).toHaveBeenCalledWith(sortCondition);
        expect(skipMock).toHaveBeenCalledWith(skip);
        expect(limitMock).toHaveBeenCalledWith(limit);
        expect(execMock).toHaveBeenCalled();
        expect(result).toEqual(mockEmployees);
    });

    it('should handle errors gracefully', async () => {
        const queryConditions = { isEmployeeDeleted: false };
        const sortCondition = { fullName: 1 };
        const skip = 0;
        const limit = 10;
        const mockError = new Error('Database error');

        console.log = jest.fn();
        const execMock = jest.fn().mockRejectedValue(mockError);
        const limitMock = jest.fn().mockReturnValue({ exec: execMock });
        const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
        const sortMock = jest.fn().mockReturnValue({ skip: skipMock });
        const populateMock = jest.fn().mockReturnValue({ sort: sortMock });

        Employee.find.mockReturnValue({ populate: populateMock });

        const result = await findEmployees(queryConditions, sortCondition, skip, limit);

        expect(Employee.find).toHaveBeenCalledWith(queryConditions);
        expect(populateMock).toHaveBeenCalledWith({
            path: 'employeeInformation.department',
            select: 'departmentName'
        });
        expect(sortMock).toHaveBeenCalledWith(sortCondition);
        expect(skipMock).toHaveBeenCalledWith(skip);
        expect(limitMock).toHaveBeenCalledWith(limit);
        expect(execMock).toHaveBeenCalled();
        expect(result).toEqual(mockError);
    });
});
