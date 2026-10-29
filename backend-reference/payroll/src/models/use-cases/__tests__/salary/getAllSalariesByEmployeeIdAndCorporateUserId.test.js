const { getAllSalariesByEmployeeIdAndCorporateUserId } = require('../../../use-cases/salary'); // Adjust the path accordingly
const Salary = require('../../../entities/salary'); // Adjust the path accordingly

jest.mock('../../../entities/salary');

describe('getAllSalariesByEmployeeIdAndCorporateUserId', () => {
    let execMock, countDocumentsMock;

    beforeEach(() => {
        jest.clearAllMocks();

        execMock = jest.fn();
        countDocumentsMock = jest.fn();

        const mockFindChain = {
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            exec: execMock
        };

        Salary.find.mockImplementation(() => mockFindChain);
        Salary.countDocuments.mockImplementation(countDocumentsMock);
    });

    it('should return the salary details for valid inputs', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            employeeId: 'validEmployeeId',
            page: 1,
            limit: 10,
            column: 0,
            order: 'asc',
            year: 2023
        };

        const mockSalaries = [
            {
                _id: '60c72b2f5f1b2c001c8e4cfb',
                employee: 'validEmployeeId',
                corporateUser: 'validCorporateUserId',
                salaryCycleEnd: new Date('2023-01-31'),
                paySlipEmailSent: true
            }
        ];

        execMock.mockResolvedValue(mockSalaries);
        countDocumentsMock.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

        const result = await getAllSalariesByEmployeeIdAndCorporateUserId(params);

        expect(Salary.find).toHaveBeenCalledWith({
            employee: params.employeeId,
            corporateUser: params.corporateUserID,
            year: params.year
        });
        expect(Salary.find().sort).toHaveBeenCalledWith({ salaryCycleEnd: params.order });
        expect(Salary.find().skip).toHaveBeenCalledWith(0);
        expect(Salary.find().limit).toHaveBeenCalledWith(params.limit);
        expect(execMock).toHaveBeenCalled();
        expect(countDocumentsMock).toHaveBeenCalledTimes(2);

        expect(result).toEqual({
            count: 1,
            rows: mockSalaries,
            totalEmailed: 1
        });
    });

    it('should return an empty array if no salary details are found', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            employeeId: 'validEmployeeId',
            page: 1,
            limit: 10,
            column: 0,
            order: 'asc',
            year: 2023
        };

        const mockSalaries = [];

        execMock.mockResolvedValue(mockSalaries);
        countDocumentsMock.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

        const result = await getAllSalariesByEmployeeIdAndCorporateUserId(params);

        expect(Salary.find).toHaveBeenCalledWith({
            employee: params.employeeId,
            corporateUser: params.corporateUserID,
            year: params.year
        });
        expect(Salary.find().sort).toHaveBeenCalledWith({ salaryCycleEnd: params.order });
        expect(Salary.find().skip).toHaveBeenCalledWith(0);
        expect(Salary.find().limit).toHaveBeenCalledWith(params.limit);
        expect(execMock).toHaveBeenCalled();
        expect(countDocumentsMock).toHaveBeenCalledTimes(2);

        expect(result).toEqual({
            count: 0,
            rows: [],
            totalEmailed: 0
        });
    });

    it('should handle errors gracefully', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            employeeId: 'validEmployeeId',
            page: 1,
            limit: 10,
            column: 0,
            order: 'asc',
            year: 2023
        };

        const mockError = new Error('Database error');

        console.error = jest.fn();
        execMock.mockRejectedValue(mockError);

        const result = await getAllSalariesByEmployeeIdAndCorporateUserId(params);

        expect(Salary.find).toHaveBeenCalledWith({
            employee: params.employeeId,
            corporateUser: params.corporateUserID,
            year: params.year
        });
        expect(Salary.find().sort).toHaveBeenCalledWith({ salaryCycleEnd: params.order });
        expect(Salary.find().skip).toHaveBeenCalledWith(0);
        expect(Salary.find().limit).toHaveBeenCalledWith(params.limit);
        expect(execMock).toHaveBeenCalled();

        expect(result).toEqual(mockError);
    });
});
