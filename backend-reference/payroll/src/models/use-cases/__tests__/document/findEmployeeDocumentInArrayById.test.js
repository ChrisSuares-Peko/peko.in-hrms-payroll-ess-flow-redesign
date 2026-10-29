const { findEmployeeDocumentInArrayById } = require('../../../use-cases/documents');
const Employee = require('../../../entities/employee');

jest.mock('../../../entities/employee');

describe('findEmployeeDocumentInArrayById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the matching document for a valid documentId', async () => {
        const documentId = 'docId2';
        const employeeId = 'validEmployeeId';
        const corporateUserId = 'validCorporateUserId';

        const matchingDoc = { _id: 'docId2', name: 'PAN Card' };
        const mockEmployee = {
            employeeDocuments: [
                { _id: 'docId1', name: 'Aadhaar Card' },
                matchingDoc,
            ],
        };

        const selectMock = jest.fn().mockResolvedValue(mockEmployee);
        Employee.findOne.mockReturnValue({ select: selectMock });

        const result = await findEmployeeDocumentInArrayById(documentId, employeeId, corporateUserId);

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: employeeId,
            corporateUser: corporateUserId,
            isEmployeeDeleted: false,
        });
        expect(selectMock).toHaveBeenCalledWith('employeeDocuments');
        expect(result).toEqual(matchingDoc);
    });

    it('should return null if no document matches the documentId', async () => {
        const documentId = 'nonExistentDocId';
        const employeeId = 'validEmployeeId';
        const corporateUserId = 'validCorporateUserId';

        const mockEmployee = {
            employeeDocuments: [
                { _id: 'docId1', name: 'Aadhaar Card' },
            ],
        };

        const selectMock = jest.fn().mockResolvedValue(mockEmployee);
        Employee.findOne.mockReturnValue({ select: selectMock });

        const result = await findEmployeeDocumentInArrayById(documentId, employeeId, corporateUserId);

        expect(result).toBeNull();
    });

    it('should return null if employee is not found', async () => {
        const documentId = 'docId1';
        const employeeId = 'invalidEmployeeId';
        const corporateUserId = 'validCorporateUserId';

        const selectMock = jest.fn().mockResolvedValue(null);
        Employee.findOne.mockReturnValue({ select: selectMock });

        const result = await findEmployeeDocumentInArrayById(documentId, employeeId, corporateUserId);

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: employeeId,
            corporateUser: corporateUserId,
            isEmployeeDeleted: false,
        });
        expect(result).toBeNull();
    });

    it('should throw an error on DB failure', async () => {
        const documentId = 'docId1';
        const employeeId = 'employeeId';
        const corporateUserId = 'corporateUserId';

        const mockError = new Error('Database error');
        const selectMock = jest.fn().mockRejectedValue(mockError);
        Employee.findOne.mockReturnValue({ select: selectMock });

        await expect(findEmployeeDocumentInArrayById(documentId, employeeId, corporateUserId))
            .rejects
            .toThrow('Database error');
    });
});
