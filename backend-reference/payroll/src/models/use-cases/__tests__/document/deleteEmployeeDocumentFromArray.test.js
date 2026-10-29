const { deleteEmployeeDocumentFromArray } = require('../../../use-cases/documents');
const Employee = require('../../../entities/employee');

jest.mock('../../../entities/employee');

describe('deleteEmployeeDocumentFromArray', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should pull the matching document from the array and save the employee', async () => {
        const documentId = 'docId1';
        const employeeId = 'validEmployeeId';
        const corporateUserId = 'validCorporateUserId';

        const existingDoc = { _id: documentId, name: 'Aadhaar Card', url: 'http://example.com/doc1' };
        const employeeDocuments = [existingDoc];
        employeeDocuments.pull = jest.fn();

        const mockEmployee = {
            employeeDocuments,
            save: jest.fn().mockResolvedValue(undefined),
        };

        Employee.findOne.mockResolvedValue(mockEmployee);

        const result = await deleteEmployeeDocumentFromArray(documentId, employeeId, corporateUserId);

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: employeeId,
            corporateUser: corporateUserId,
            isEmployeeDeleted: false,
        });

        expect(employeeDocuments.pull).toHaveBeenCalledWith({ _id: documentId });
        expect(mockEmployee.save).toHaveBeenCalledTimes(1);
        expect(result).toEqual(existingDoc);
    });

    it('should return null if employee is not found', async () => {
        const documentId = 'docId1';
        const employeeId = 'invalidEmployeeId';
        const corporateUserId = 'validCorporateUserId';

        Employee.findOne.mockResolvedValue(null);

        const result = await deleteEmployeeDocumentFromArray(documentId, employeeId, corporateUserId);

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: employeeId,
            corporateUser: corporateUserId,
            isEmployeeDeleted: false,
        });
        expect(result).toBeNull();
    });

    it('should return null if no document matches the documentId', async () => {
        const documentId = 'nonExistentDocId';
        const employeeId = 'validEmployeeId';
        const corporateUserId = 'validCorporateUserId';

        const employeeDocuments = [{ _id: 'docId1', name: 'Aadhaar Card' }];
        employeeDocuments.pull = jest.fn();

        const mockEmployee = {
            employeeDocuments,
            save: jest.fn().mockResolvedValue(undefined),
        };

        Employee.findOne.mockResolvedValue(mockEmployee);

        const result = await deleteEmployeeDocumentFromArray(documentId, employeeId, corporateUserId);

        expect(employeeDocuments.pull).not.toHaveBeenCalled();
        expect(mockEmployee.save).not.toHaveBeenCalled();
        expect(result).toBeNull();
    });

    it('should throw an error on DB failure', async () => {
        const documentId = 'docId1';
        const employeeId = 'employeeId';
        const corporateUserId = 'corporateUserId';

        const mockError = new Error('Database error');
        Employee.findOne.mockRejectedValue(mockError);

        await expect(deleteEmployeeDocumentFromArray(documentId, employeeId, corporateUserId))
            .rejects
            .toThrow('Database error');
    });
});
