const { fetchIndividualLeavesByEmployeeAndCorporateUser } = require('../../../use-cases/leaveApplication');
const LeaveApplication = require('../../../entities/leaveApplication');
const { ObjectId } = require('mongoose').Types;

jest.mock('../../../entities/leaveApplication');

describe('fetchIndividualLeavesByEmployeeAndCorporateUser Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the individual leave details for the given employee and corporate user within the cycle period', async () => {
        const employeeId = new ObjectId().toString();
        const corporateUserId = 'corporateUserId';
        const cycleStart = new Date('2023-01-01');
        const cycleEnd = new Date('2023-12-31');

        const expectedLeaves = [
            { _id: new ObjectId(), leaveCount: 2, start: new Date('2023-05-01'), end: new Date('2023-05-02'), typeOfLeave: 'UNPAID' },
            { _id: new ObjectId(), leaveCount: 3, start: new Date('2023-06-01'), end: new Date('2023-06-03'), typeOfLeave: 'UNPAID' }
        ];

        LeaveApplication.find.mockResolvedValue(expectedLeaves);

        const result = await fetchIndividualLeavesByEmployeeAndCorporateUser(employeeId, corporateUserId, cycleStart, cycleEnd);

        expect(LeaveApplication.find).toHaveBeenCalledWith({
            employee: new ObjectId(employeeId),
            corporateUser: corporateUserId,
            start: {
                $gte: cycleStart,
                $lte: cycleEnd
            },
            typeOfLeave: 'UNPAID'
        });

        expect(result).toEqual(expectedLeaves);
    });

    it('should return an error if the database operation fails', async () => {
        const employeeId = new ObjectId().toString();
        const corporateUserId = 'corporateUserId';
        const cycleStart = new Date('2023-01-01');
        const cycleEnd = new Date('2023-12-31');
        const errorMessage = 'Database error';

        LeaveApplication.find.mockRejectedValue(new Error(errorMessage));

        const result = await fetchIndividualLeavesByEmployeeAndCorporateUser(employeeId, corporateUserId, cycleStart, cycleEnd);

        expect(result).toEqual(new Error(errorMessage));
    });
});
