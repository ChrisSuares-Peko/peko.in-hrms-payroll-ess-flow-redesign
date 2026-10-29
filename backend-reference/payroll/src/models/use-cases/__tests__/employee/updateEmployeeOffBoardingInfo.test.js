const { updateEmployeeOffBoardingInfo } = require('../../../use-cases/employee'); // Adjust the path accordingly
const Employee = require('../../../entities/employee'); // Adjust the path accordingly

jest.mock('../../../entities/employee');

describe('updateEmployeeOffBoardingInfo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the employee off-boarding information successfully', async () => {
        const employeeId = 'employeeId1';
        const corporateUserId = 'corporateUserId1';
        const offBoardingData = {
            offBoardingDate: '2024-08-01',
            lastWorkingDay: '2024-08-31',
            noticePeriod: 30,
            offBoardingType: 'Voluntary',
            reasonForOffBoarding: 'Personal reasons'
        };
        const mockUpdatedEmployee = {
            _id: employeeId,
            corporateUser: corporateUserId,
            offBoardingInformation: offBoardingData
        };

        Employee.findOneAndUpdate.mockResolvedValue(mockUpdatedEmployee);

        const result = await updateEmployeeOffBoardingInfo(employeeId, corporateUserId, offBoardingData);

        expect(Employee.findOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: employeeId,
                corporateUser: corporateUserId,
                isEmployeeDeleted: false,
                "employeeInformation.employeeStatus": { $ne: 'ACTIVE' },
                "offBoardingInformation.offBoardingType": { $exists: true }
            },
            {
                $set: {
                    "offBoardingInformation.offBoardingDate": offBoardingData.offBoardingDate,
                    "offBoardingInformation.lastWorkingDay": offBoardingData.lastWorkingDay,
                    "offBoardingInformation.noticePeriod": offBoardingData.noticePeriod,
                    "offBoardingInformation.offBoardingType": offBoardingData.offBoardingType,
                    "offBoardingInformation.reasonForOffBoarding": offBoardingData.reasonForOffBoarding
                }
            },
            { new: true }
        );
        expect(result).toEqual(mockUpdatedEmployee);
    });

    it('should handle errors gracefully', async () => {
        const employeeId = 'employeeId1';
        const corporateUserId = 'corporateUserId1';
        const offBoardingData = {
            offBoardingDate: '2024-08-01',
            lastWorkingDay: '2024-08-31',
            noticePeriod: 30,
            offBoardingType: 'Voluntary',
            reasonForOffBoarding: 'Personal reasons'
        };
        const mockError = new Error('Database error');

        Employee.findOneAndUpdate.mockRejectedValue(mockError);
        console.log = jest.fn();

        const result = await updateEmployeeOffBoardingInfo(employeeId, corporateUserId, offBoardingData);

        expect(Employee.findOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: employeeId,
                corporateUser: corporateUserId,
                isEmployeeDeleted: false,
                "employeeInformation.employeeStatus": { $ne: 'ACTIVE' },
                "offBoardingInformation.offBoardingType": { $exists: true }
            },
            {
                $set: {
                    "offBoardingInformation.offBoardingDate": offBoardingData.offBoardingDate,
                    "offBoardingInformation.lastWorkingDay": offBoardingData.lastWorkingDay,
                    "offBoardingInformation.noticePeriod": offBoardingData.noticePeriod,
                    "offBoardingInformation.offBoardingType": offBoardingData.offBoardingType,
                    "offBoardingInformation.reasonForOffBoarding": offBoardingData.reasonForOffBoarding
                }
            },
            { new: true }
        );
        expect(result).toEqual(mockError);
    });
});
