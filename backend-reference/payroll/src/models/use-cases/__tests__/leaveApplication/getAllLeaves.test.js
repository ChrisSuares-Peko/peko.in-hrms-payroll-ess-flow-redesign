const { getAllLeaves } = require('../../../use-cases/leaveApplication');
const LeaveApplication = require('../../../entities/leaveApplication');
const LeaveComponent = require('../../../entities/leaveComponent');

jest.mock('../../../entities/leaveApplication');
jest.mock('../../../entities/leaveComponent');

describe('getAllLeaves Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    it('should return paginated leave data and total count', async () => {
        const params = {
            corporateUserID: 'corporateUserID',
            page: '1',
            limit: '10',
            searchText: '',
            year: '2023',
            month: '7'
        };

        const firstDayOfMonth = new Date(2023, 6, 1);
        const lastMillisecondOfLastDay = new Date(2023, 7, 0, 23, 59, 59, 999);

        const typeOfLeaveId = 'leaveTypeId1';
        const employeeId = 'empId1';

        const leaveData = [
            {
                employee: { _id: employeeId, isEmployeeDeleted: false },
                typeOfLeave: { _id: typeOfLeaveId, leaveType: 'Annual' },
                start: new Date('2023-07-10'),
                leaveCount: 2
            }
        ];

        const mockLeaveComponent = { _id: typeOfLeaveId, maximumNumberOfLeaves: 20 };

        LeaveApplication.aggregate
            .mockResolvedValueOnce(leaveData)
            .mockResolvedValueOnce([{ _id: null, totalUsedBefore: 5 }]);

        LeaveComponent.findOne.mockResolvedValue(mockLeaveComponent);

        const result = await getAllLeaves(params);

        expect(LeaveApplication.aggregate).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    $match: expect.objectContaining({
                        corporateUser: params.corporateUserID,
                        start: {
                            $gte: firstDayOfMonth,
                            $lte: lastMillisecondOfLastDay
                        }
                    })
                })
            ])
        );

        expect(result).toMatchObject({
            totalCount: 1,
            leaveData: expect.any(Array)
        });
    });

    it('should handle errors gracefully', async () => {
        const params = {
            corporateUserID: 'corporateUserID',
            page: '1',
            limit: '10',
            searchText: '',
            year: '2023',
            month: '7'
        };
        const errorMessage = 'Database error';

        LeaveApplication.aggregate.mockRejectedValue(new Error(errorMessage));

        const result = await getAllLeaves(params);

        expect(result.message).toEqual(errorMessage);
    });
});
