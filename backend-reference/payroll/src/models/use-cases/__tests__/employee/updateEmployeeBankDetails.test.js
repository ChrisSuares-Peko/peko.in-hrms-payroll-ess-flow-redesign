const { updateEmployeeBankDetails } = require('../../../use-cases/employee'); // Adjust the path accordingly
const Employee = require('../../../entities/employee'); // Adjust the path accordingly

jest.mock('../../../entities/employee');

describe('updateEmployeeBankDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the employee bank details successfully', async () => {
        const id = 'employeeId1';
        const corporateUserId = 'corporateUserId1';
        const bankDetails = {
            accountName: 'John Doe',
            accountNumber: '123456789',
            swiftCode: 'ABCDEF123',
            bankName: 'Bank Name',
            bankBranch: 'Bank Branch',
            ibanNumber: 'IBAN123456',
            accountType: 'Savings',
            beneficiaryName: 'John Doe',
            routingCode: '987654321'
        };
        const mockUpdatedEmployee = {
            _id: id,
            corporateUser: corporateUserId,
            bankDetails
        };

        Employee.findOneAndUpdate.mockResolvedValue(mockUpdatedEmployee);

        const result = await updateEmployeeBankDetails(id, corporateUserId, bankDetails);

        expect(Employee.findOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: id,
                corporateUser: corporateUserId,
                isEmployeeDeleted: false
            },
            {
                $set: {
                    "bankDetails.accountName": bankDetails.accountName,
                    "bankDetails.accountNumber": bankDetails.accountNumber,
                    "bankDetails.swiftCode": bankDetails.swiftCode,
                    "bankDetails.bankName": bankDetails.bankName,
                    "bankDetails.bankBranch": bankDetails.bankBranch,
                    "bankDetails.ibanNumber": bankDetails.ibanNumber,
                    "bankDetails.accountType": bankDetails.accountType,
                    "bankDetails.beneficiaryName": bankDetails.beneficiaryName,
                    "bankDetails.routingCode": bankDetails.routingCode
                }
            },
            { new: true }
        );
        expect(result).toEqual(mockUpdatedEmployee);
    });

    it('should handle errors gracefully', async () => {
        const id = 'employeeId1';
        const corporateUserId = 'corporateUserId1';
        const bankDetails = {
            accountName: 'John Doe',
            accountNumber: '123456789',
            swiftCode: 'ABCDEF123',
            bankName: 'Bank Name',
            bankBranch: 'Bank Branch',
            ibanNumber: 'IBAN123456',
            accountType: 'Savings',
            beneficiaryName: 'John Doe',
            routingCode: '987654321'
        };
        const mockError = new Error('Database error');

        console.log = jest.fn();
        Employee.findOneAndUpdate.mockRejectedValue(mockError);

        const result = await updateEmployeeBankDetails(id, corporateUserId, bankDetails);

        expect(Employee.findOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: id,
                corporateUser: corporateUserId,
                isEmployeeDeleted: false
            },
            {
                $set: {
                    "bankDetails.accountName": bankDetails.accountName,
                    "bankDetails.accountNumber": bankDetails.accountNumber,
                    "bankDetails.swiftCode": bankDetails.swiftCode,
                    "bankDetails.bankName": bankDetails.bankName,
                    "bankDetails.bankBranch": bankDetails.bankBranch,
                    "bankDetails.ibanNumber": bankDetails.ibanNumber,
                    "bankDetails.accountType": bankDetails.accountType,
                    "bankDetails.beneficiaryName": bankDetails.beneficiaryName,
                    "bankDetails.routingCode": bankDetails.routingCode
                }
            },
            { new: true }
        );
        expect(result).toEqual(mockError);
    });
});
