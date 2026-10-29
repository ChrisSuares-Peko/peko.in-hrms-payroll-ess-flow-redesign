const { getEmployeesUsingCorporateId } = require('../../../use-cases/employee'); // Adjust the path accordingly
const Employee = require('../../../entities/employee'); // Adjust the path accordingly
const mongoose = require('mongoose');

jest.mock('../../../entities/employee');

describe('getEmployeesUsingCorporateId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return employees for a valid corporate user ID', async () => {
        const corporateUserId = new mongoose.Types.ObjectId();
        const mockEmployees = [
            { _id: new mongoose.Types.ObjectId(), fullName: 'John Doe' },
            { _id: new mongoose.Types.ObjectId(), fullName: 'Jane Doe' }
        ];

        Employee.find.mockResolvedValue(mockEmployees);

        const result = await getEmployeesUsingCorporateId(corporateUserId);

        expect(Employee.find).toHaveBeenCalledWith({ corporateUser: corporateUserId });
        expect(result).toEqual(mockEmployees);
    });

    it('should handle errors gracefully', async () => {
        const corporateUserId = new mongoose.Types.ObjectId();
        const mockError = new Error('Database error');

        Employee.find.mockRejectedValue(mockError);

        const result = await getEmployeesUsingCorporateId(corporateUserId);

        expect(Employee.find).toHaveBeenCalledWith({ corporateUser: corporateUserId });
        expect(result).toEqual(mockError);
    });
});
