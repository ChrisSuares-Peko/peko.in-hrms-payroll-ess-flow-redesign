const { findEmployeeDocumentsInArray } = require('../../../use-cases/documents');
const Employee = require('../../../entities/employee');

jest.mock('../../../entities/employee');

describe('findEmployeeDocumentsInArray', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return sorted documents and total count for a valid employee', async () => {
        const employeeId = 'validEmployeeId';
        const corporateUserId = 'validCorporateUserId';

        const mockEmployee = {
            employeeDocuments: [
                { _id: 'docId1', name: 'Aadhaar', createdAt: new Date('2023-01-01') },
                { _id: 'docId2', name: 'PAN', createdAt: new Date('2023-06-01') },
            ],
        };

        const selectMock = jest.fn().mockResolvedValue(mockEmployee);
        Employee.findOne.mockReturnValue({ select: selectMock });

        const result = await findEmployeeDocumentsInArray(employeeId, corporateUserId);

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: employeeId,
            corporateUser: corporateUserId,
            isEmployeeDeleted: false,
        });
        expect(selectMock).toHaveBeenCalledWith('employeeDocuments');

        expect(result).toEqual({
            documents: [
                { _id: 'docId2', name: 'PAN', createdAt: new Date('2023-06-01') },
                { _id: 'docId1', name: 'Aadhaar', createdAt: new Date('2023-01-01') },
            ],
            total: 2,
        });
    });

    it('should filter documents by search text (case-insensitive)', async () => {
        const employeeId = 'validEmployeeId';
        const corporateUserId = 'validCorporateUserId';

        const mockEmployee = {
            employeeDocuments: [
                { _id: 'docId1', name: 'Aadhaar Card', createdAt: new Date('2023-01-01') },
                { _id: 'docId2', name: 'PAN Card', createdAt: new Date('2023-06-01') },
            ],
        };

        const selectMock = jest.fn().mockResolvedValue(mockEmployee);
        Employee.findOne.mockReturnValue({ select: selectMock });

        const result = await findEmployeeDocumentsInArray(employeeId, corporateUserId, { search: 'pan' });

        expect(result).toEqual({
            documents: [
                { _id: 'docId2', name: 'PAN Card', createdAt: new Date('2023-06-01') },
            ],
            total: 1,
        });
    });

    it('should paginate documents based on page and limit', async () => {
        const employeeId = 'validEmployeeId';
        const corporateUserId = 'validCorporateUserId';

        const mockEmployee = {
            employeeDocuments: [
                { _id: 'docId1', name: 'Doc 1', createdAt: new Date('2023-01-01') },
                { _id: 'docId2', name: 'Doc 2', createdAt: new Date('2023-02-01') },
                { _id: 'docId3', name: 'Doc 3', createdAt: new Date('2023-03-01') },
            ],
        };

        const selectMock = jest.fn().mockResolvedValue(mockEmployee);
        Employee.findOne.mockReturnValue({ select: selectMock });

        const result = await findEmployeeDocumentsInArray(employeeId, corporateUserId, { page: 2, limit: 1 });

        // sorted desc by createdAt: Doc3, Doc2, Doc1 -> page 2, limit 1 -> skip 1 -> [Doc2]
        expect(result).toEqual({
            documents: [
                { _id: 'docId2', name: 'Doc 2', createdAt: new Date('2023-02-01') },
            ],
            total: 3,
        });
    });

    it('should return null if employee is not found', async () => {
        const employeeId = 'invalidEmployeeId';
        const corporateUserId = 'validCorporateUserId';

        const selectMock = jest.fn().mockResolvedValue(null);
        Employee.findOne.mockReturnValue({ select: selectMock });

        const result = await findEmployeeDocumentsInArray(employeeId, corporateUserId);

        expect(Employee.findOne).toHaveBeenCalledWith({
            _id: employeeId,
            corporateUser: corporateUserId,
            isEmployeeDeleted: false,
        });
        expect(result).toBeNull();
    });

    it('should throw an error on DB failure', async () => {
        const employeeId = 'employeeId';
        const corporateUserId = 'corporateUserId';

        const mockError = new Error('Database error');
        const selectMock = jest.fn().mockRejectedValue(mockError);
        Employee.findOne.mockReturnValue({ select: selectMock });

        await expect(findEmployeeDocumentsInArray(employeeId, corporateUserId))
            .rejects
            .toThrow('Database error');
    });
});
