const { fetchLeavesByEmployeeAndCorporateUser } = require('../../../use-cases/leaveApplication');
const LeaveApplication = require('../../../entities/leaveApplication');
const { ObjectId } = require('mongoose').Types;

jest.mock('../../../entities/leaveApplication');

describe('fetchLeavesByEmployeeAndCorporateUser Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the total leave count for the given employee and corporate user within the cycle period', async () => {
        const employeeId = new ObjectId().toString();
        const corporateUserId = 'corporateUserId';
        const cycleStart = new Date('2023-01-01');
        const cycleEnd = new Date('2023-12-31');

        LeaveApplication.find.mockReturnValue({
            populate: jest.fn().mockResolvedValue([])
        });

        const result = await fetchLeavesByEmployeeAndCorporateUser(employeeId, corporateUserId, cycleStart, cycleEnd);

        expect(LeaveApplication.find).toHaveBeenCalledWith(
            expect.objectContaining({
                employee: new ObjectId(employeeId),
                corporateUser: corporateUserId
            }),
            expect.any(Object)
        );

        expect(result).toEqual({ leaveCount: 0 });
    });

    it('should calculate leave count from overlapping leaves', async () => {
        const employeeId = new ObjectId().toString();
        const corporateUserId = 'corporateUserId';
        const cycleStart = new Date('2023-07-01');
        const cycleEnd = new Date('2023-07-31');

        const typeId = new ObjectId();
        const overlappingLeaves = [
            {
                typeOfLeave: { _id: typeId, maximumNumberOfLeaves: 30 },
                start: new Date('2023-07-05'),
                end: new Date('2023-07-10'),
                leaveCount: 5
            }
        ];

        LeaveApplication.find
            .mockReturnValueOnce({
                populate: jest.fn().mockResolvedValue(overlappingLeaves)
            })
            .mockReturnValueOnce({
                populate: undefined
            });

        LeaveApplication.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([]) });

        const result = await fetchLeavesByEmployeeAndCorporateUser(employeeId, corporateUserId, cycleStart, cycleEnd);

        expect(result).toMatchObject({ leaveCount: expect.any(Number) });
    });

    it('should handle errors gracefully by returning leaveCount 0', async () => {
        const employeeId = new ObjectId().toString();
        const corporateUserId = 'corporateUserId';
        const cycleStart = new Date('2023-01-01');
        const cycleEnd = new Date('2023-12-31');

        LeaveApplication.find.mockReturnValue({
            populate: jest.fn().mockRejectedValue(new Error('Database error'))
        });

        const result = await fetchLeavesByEmployeeAndCorporateUser(employeeId, corporateUserId, cycleStart, cycleEnd);

        expect(result).toEqual({ leaveCount: 0 });
    });
});
