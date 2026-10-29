const { addEmployeeDocument } = require('../../../use-cases/documents'); 
const Employee = require('../../../entities/employee'); 

// Mock the Employee model
jest.mock('../../../entities/employee');

describe('addEmployeeDocument', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should add a document to the employee and return the updated employee', async () => {
        const employeeId = 'validEmployeeId';
        const corporateUserId = 'validCorporateUserId';
        const documentData = { name: 'Document Name', content: 'Document Content' };

        const mockUpdatedEmployee = {
            _id: employeeId,
            corporateUser: corporateUserId,
            employeeDocuments: [documentData],
            isEmployeeDeleted: false,
        };

        Employee.findOneAndUpdate.mockResolvedValue(mockUpdatedEmployee);

        const result = await addEmployeeDocument(employeeId, corporateUserId, documentData);

        expect(Employee.findOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: employeeId,
                corporateUser: corporateUserId,
                isEmployeeDeleted: false,
            },
            {
                $push: { employeeDocuments: documentData }
            },
            { new: true }
        );

        expect(result).toEqual(mockUpdatedEmployee);
    });

    it('should return null if employee is not found', async () => {
        const employeeId = 'invalidEmployeeId';
        const corporateUserId = 'validCorporateUserId';
        const documentData = { name: 'Document Name', content: 'Document Content' };

        Employee.findOneAndUpdate.mockResolvedValue(null);

        const result = await addEmployeeDocument(employeeId, corporateUserId, documentData);

        expect(Employee.findOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: employeeId,
                corporateUser: corporateUserId,
                isEmployeeDeleted: false,
            },
            {
                $push: { employeeDocuments: documentData }
            },
            { new: true }
        );

        expect(result).toBeNull();
    });

    it('should throw an error if there is a problem adding the document', async () => {
        const employeeId = 'employeeId';
        const corporateUserId = 'corporateUserId';
        const documentData = { name: 'Document Name', content: 'Document Content' };

        const mockError = new Error('Database error');

        Employee.findOneAndUpdate.mockRejectedValue(mockError);

        await expect(addEmployeeDocument(employeeId, corporateUserId, documentData))
            .rejects
            .toThrow('Failed to add document to employee: Database error');

        expect(Employee.findOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: employeeId,
                corporateUser: corporateUserId,
                isEmployeeDeleted: false,
            },
            {
                $push: { employeeDocuments: documentData }
            },
            { new: true }
        );
    });
});
