const { getUnbankedEmployees } = require('../../../use-cases/employee');
const Employee = require('../../../entities/employee');
const BankDetails = require('../../../entities/bankDetails');

jest.mock('../../../entities/employee');
jest.mock('../../../entities/bankDetails');

describe('getUnbankedEmployees', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return unbanked employees successfully', async () => {
        const corporateUserId = 'corporateUserId1';

        const emp1Id = 'employeeId1';
        const emp2Id = 'employeeId2';
        const emp3Id = 'employeeId3';

        const allEmployees = [
            { _id: { toString: () => emp1Id } },
            { _id: { toString: () => emp2Id } },
            { _id: { toString: () => emp3Id } }
        ];

        Employee.find.mockResolvedValue(allEmployees);
        BankDetails.distinct.mockResolvedValue([emp1Id]);

        const result = await getUnbankedEmployees(corporateUserId);

        expect(Employee.find).toHaveBeenCalledWith(
            expect.objectContaining({
                corporateUser: corporateUserId,
                isEmployeeDeleted: false
            }),
            '_id'
        );
        expect(BankDetails.distinct).toHaveBeenCalledWith('employeeId', { corporateUser: corporateUserId });

        expect(result).toHaveLength(2);
    });

    it('should return empty array when all employees are banked', async () => {
        const corporateUserId = 'corporateUserId1';
        const empId = 'employeeId1';

        Employee.find.mockResolvedValue([{ _id: { toString: () => empId } }]);
        BankDetails.distinct.mockResolvedValue([empId]);

        const result = await getUnbankedEmployees(corporateUserId);

        expect(result).toEqual([]);
    });

    it('should handle errors gracefully by returning empty array', async () => {
        const corporateUserId = 'corporateUserId1';

        Employee.find.mockRejectedValue(new Error('Database error'));
        console.log = jest.fn();

        const result = await getUnbankedEmployees(corporateUserId);

        expect(result).toEqual([]);
    });
});
