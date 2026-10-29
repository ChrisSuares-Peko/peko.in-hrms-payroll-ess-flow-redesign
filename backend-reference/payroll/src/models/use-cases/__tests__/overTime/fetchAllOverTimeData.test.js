const { fetchAllOverTimeData } = require('../../../use-cases/overTime'); // Adjust the path accordingly
const Overtime = require('../../../entities/overTime'); // Adjust the path accordingly
const Employee = require('../../../entities/employee');

jest.mock('../../../entities/overTime');
jest.mock('../../../entities/employee');

describe('fetchAllOverTimeData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all overtime data for valid inputs', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            page: 1,
            limit: 10,
            searchText: 'APPROVED'
        };

        const rawRecord = {
            _id: '60c72b2f5f1b2c001c8e4cfb',
            corporateUser: params.corporateUserID,
            employee: 'employeeId1',
            paymentStatus: 'APPROVED',
            overTimeDate: new Date('2024-08-15T00:00:00.000Z')
        };
        const mockOvertimeData = [
            {
                ...rawRecord,
                toJSON: jest.fn().mockReturnValue(rawRecord)
            }
        ];

        const mockCount = 1;
        const mockEmployee = {
            _id: 'employeeId1',
            personalInformation: { fullName: 'John Doe', email: 'john@example.com' },
            profileImage: null,
            employeeInformation: { designation: 'Engineer' }
        };

        Overtime.find.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(mockOvertimeData)
        });

        Overtime.countDocuments.mockResolvedValue(mockCount);
        Employee.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue([mockEmployee])
        });

        const result = await fetchAllOverTimeData(params);

        expect(Overtime.find).toHaveBeenCalledWith(expect.objectContaining({
            corporateUser: params.corporateUserID,
            $or: [{ paymentStatus: { $regex: params.searchText, $options: 'i' } }]
        }));

        expect(Employee.find).toHaveBeenCalledWith(
            { _id: { $in: ['employeeId1'] } },
            'personalInformation.fullName personalInformation.email profileImage employeeInformation'
        );

        expect(result).toEqual({
            totalCount: mockCount,
            overTimeData: [
                {
                    ...rawRecord,
                    status: null,
                    employeeDetails: {
                        fullName: 'John Doe',
                        email: 'john@example.com',
                        profileImage: null,
                        designation: 'Engineer'
                    }
                }
            ]
        });
    });

    it('should return an empty array if no overtime data is found', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            page: 1,
            limit: 10,
            searchText: 'PENDING'
        };

        const mockOvertimeData = [];
        const mockCount = 0;

        Overtime.find.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(mockOvertimeData)
        });

        Overtime.countDocuments.mockResolvedValue(mockCount);
        Employee.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
        });

        const result = await fetchAllOverTimeData(params);

        expect(Overtime.find).toHaveBeenCalledWith(expect.objectContaining({
            corporateUser: params.corporateUserID,
            $or: [{ paymentStatus: { $regex: params.searchText, $options: 'i' } }]
        }));

        expect(result).toEqual({
            totalCount: mockCount,
            overTimeData: []
        });
    });

    it('should handle errors gracefully', async () => {
        const params = {
            corporateUserID: 'validCorporateUserId',
            page: 1,
            limit: 10,
            searchText: 'APPROVED'
        };

        const mockError = new Error('Database error');

        Overtime.find.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            exec: jest.fn().mockRejectedValue(mockError)
        });

        const result = await fetchAllOverTimeData(params);

        expect(Overtime.find).toHaveBeenCalledWith(expect.objectContaining({
            corporateUser: params.corporateUserID,
            $or: [{ paymentStatus: { $regex: params.searchText, $options: 'i' } }]
        }));

        expect(result).toEqual(mockError);
    });
});
