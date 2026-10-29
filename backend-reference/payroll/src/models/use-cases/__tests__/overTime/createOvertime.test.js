const { createOverTimeData } = require('../../../use-cases/overTime'); 
const Overtime = require('../../../entities/overTime'); 

jest.mock('../../../entities/overTime');

describe('createOverTimeData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create new overtime data successfully', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            employeeId: 'validEmployeeId',
            overtimeData: {
                hoursWorked: 5,
                date: new Date('2024-08-01')
            }
        };

        const mockSavedOverTime = {
            ...params.overtimeData,
            _id: '60c72b2f5f1b2c001c8e4cfb',
            corporateUser: params.corporateUserID,
            employee: params.employeeId
        };

        const mockSave = jest.fn().mockResolvedValue(mockSavedOverTime);
        Overtime.mockImplementation(() => ({
            save: mockSave
        }));

        const result = await createOverTimeData(params);

        expect(Overtime).toHaveBeenCalledWith({
            corporateUser: params.corporateUserID,
            employee: params.employeeId,
            ...params.overtimeData
        });
        expect(mockSave).toHaveBeenCalled();
        expect(result).toEqual(mockSavedOverTime);
    });

    it('should handle errors gracefully', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            employeeId: 'validEmployeeId',
            overtimeData: {
                hoursWorked: 5,
                date: new Date('2024-08-01')
            }
        };

        const mockError = new Error('Database error');

        const mockSave = jest.fn().mockRejectedValue(mockError);
        Overtime.mockImplementation(() => ({
            save: mockSave
        }));

        const result = await createOverTimeData(params);

        expect(Overtime).toHaveBeenCalledWith({
            corporateUser: params.corporateUserID,
            employee: params.employeeId,
            ...params.overtimeData
        });
        expect(mockSave).toHaveBeenCalled();
        expect(result).toEqual(mockError);
    });
});
