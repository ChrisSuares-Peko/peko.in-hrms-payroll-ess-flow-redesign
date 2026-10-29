const { updateEmployeeDocumentInArray } = require('../../../use-cases/documents');
const Employee = require('../../../entities/employee');

jest.mock('../../../entities/employee');

describe('updateEmployeeDocumentInArray', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the matching document fields and save the employee', async () => {
        const documentId = 'docId1';
        const employeeId = 'validEmployeeId';
        const corporateUserId = 'validCorporateUserId';
        const documentData = {
            name: 'Updated Name',
            url: 'http://example.com/updated',
            expiryDate: new Date('2025-01-01'),
        };

        const existingDoc = {
            _id: documentId,
            name: 'Old Name',
            url: 'http://example.com/old',
            expiryDate: new Date('2023-01-01'),
        };

        const mockEmployee = {
            employeeDocuments: [existingDoc],
            save: jest.fn().mockResolvedValue(undefined),
        };

        Employee.findOne.mockResolvedValue(mockEmployee);

        const result = await updateEmployeeDocumentInArray(documentId, employeeId, corporateUserId, documentData);

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: employeeId,
            corporateUser: corporateUserId,
            isEmployeeDeleted: false,
        });

        expect(mockEmployee.save).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            _id: documentId,
            name: 'Updated Name',
            url: 'http://example.com/updated',
            expiryDate: new Date('2025-01-01'),
        });
    });

    it('should return null if employee is not found', async () => {
        const documentId = 'docId1';
        const employeeId = 'invalidEmployeeId';
        const corporateUserId = 'validCorporateUserId';
        const documentData = { name: 'Updated Name', url: 'url', expiryDate: new Date() };

        Employee.findOne.mockResolvedValue(null);

        const result = await updateEmployeeDocumentInArray(documentId, employeeId, corporateUserId, documentData);

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
        const documentData = { name: 'Updated Name', url: 'url', expiryDate: new Date() };

        const mockEmployee = {
            employeeDocuments: [{ _id: 'docId1', name: 'Aadhaar Card' }],
            save: jest.fn().mockResolvedValue(undefined),
        };

        Employee.findOne.mockResolvedValue(mockEmployee);

        const result = await updateEmployeeDocumentInArray(documentId, employeeId, corporateUserId, documentData);

        expect(mockEmployee.save).not.toHaveBeenCalled();
        expect(result).toBeNull();
    });

    it('should throw an error on DB failure', async () => {
        const documentId = 'docId1';
        const employeeId = 'employeeId';
        const corporateUserId = 'corporateUserId';
        const documentData = { name: 'Updated Name', url: 'url', expiryDate: new Date() };

        const mockError = new Error('Database error');
        Employee.findOne.mockRejectedValue(mockError);

        await expect(updateEmployeeDocumentInArray(documentId, employeeId, corporateUserId, documentData))
            .rejects
            .toThrow('Database error');
    });
});
