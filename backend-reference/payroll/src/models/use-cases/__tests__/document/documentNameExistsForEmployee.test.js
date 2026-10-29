const { documentNameExistsForEmployee } = require('../../../use-cases/documents');
const Employee = require('../../../entities/employee');

jest.mock('../../../entities/employee');

describe('documentNameExistsForEmployee', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return true if a document with the given name exists', async () => {
        const employeeId = 'validEmployeeId';
        const corporateUserId = 'validCorporateUserId';
        const name = 'PAN Card';

        const mockEmployee = {
            employeeDocuments: [
                { _id: 'docId1', name: 'Aadhaar Card' },
                { _id: 'docId2', name: 'PAN Card' },
            ],
        };

        const selectMock = jest.fn().mockResolvedValue(mockEmployee);
        Employee.findOne.mockReturnValue({ select: selectMock });

        const result = await documentNameExistsForEmployee(employeeId, corporateUserId, name);

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: employeeId,
            corporateUser: corporateUserId,
            isEmployeeDeleted: false,
        });
        expect(selectMock).toHaveBeenCalledWith('employeeDocuments');
        expect(result).toBe(true);
    });

    it('should return false if no document with the given name exists', async () => {
        const employeeId = 'validEmployeeId';
        const corporateUserId = 'validCorporateUserId';
        const name = 'Passport';

        const mockEmployee = {
            employeeDocuments: [
                { _id: 'docId1', name: 'Aadhaar Card' },
                { _id: 'docId2', name: 'PAN Card' },
            ],
        };

        const selectMock = jest.fn().mockResolvedValue(mockEmployee);
        Employee.findOne.mockReturnValue({ select: selectMock });

        const result = await documentNameExistsForEmployee(employeeId, corporateUserId, name);

        expect(result).toBe(false);
    });

    it('should return false if employee is not found', async () => {
        const employeeId = 'invalidEmployeeId';
        const corporateUserId = 'validCorporateUserId';
        const name = 'PAN Card';

        const selectMock = jest.fn().mockResolvedValue(null);
        Employee.findOne.mockReturnValue({ select: selectMock });

        const result = await documentNameExistsForEmployee(employeeId, corporateUserId, name);

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: employeeId,
            corporateUser: corporateUserId,
            isEmployeeDeleted: false,
        });
        expect(result).toBe(false);
    });

    it('should throw an error on DB failure', async () => {
        const employeeId = 'employeeId';
        const corporateUserId = 'corporateUserId';
        const name = 'PAN Card';

        const mockError = new Error('Database error');
        const selectMock = jest.fn().mockRejectedValue(mockError);
        Employee.findOne.mockReturnValue({ select: selectMock });

        await expect(documentNameExistsForEmployee(employeeId, corporateUserId, name))
            .rejects
            .toThrow('Database error');
    });
});
