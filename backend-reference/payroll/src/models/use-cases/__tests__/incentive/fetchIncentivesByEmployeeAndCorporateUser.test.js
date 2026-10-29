const { fetchIncentivesByEmployeeAndCorporateUser } = require('../../../use-cases/incentives');
const Incentives = require('../../../entities/incentives');
const mongoose = require('mongoose');

jest.mock('../../../entities/incentives');

describe('fetchIncentivesByEmployeeAndCorporateUser', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the total incentives pay and incentives IDs for valid inputs', async () => {
        const employeeId = '60c72b2f5f1b2c001c8e4cfb';
        const corporateUserId = 'validCorporateUserId';
        const month = 1;
        const year = 2023;

        const firstDayOfMonth = new Date(year, month - 1, 1);
        const firstDayOfNextMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(firstDayOfNextMonth - 1);

        const mockIncentives = [
            {
                _id: null,
                totalIncentivesPay: 1000,
                incentivesIds: [new mongoose.Types.ObjectId('60c72b2f5f1b2c001c8e4cfb')],
            },
        ];

        Incentives.aggregate.mockResolvedValue(mockIncentives);

        const result = await fetchIncentivesByEmployeeAndCorporateUser(employeeId, corporateUserId, month, year);

        expect(Incentives.aggregate).toHaveBeenCalledWith([
            {
                $match: {
                    employee: new mongoose.Types.ObjectId(employeeId),
                    corporateUser: corporateUserId,
                    incentiveDate: {
                        $gte: firstDayOfMonth,
                        $lte: lastDayOfMonth
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalIncentivesPay: { $sum: "$amount" },
                    incentivesIds: { $push: "$_id" }
                }
            }
        ]);

        expect(result).toEqual(mockIncentives[0]);
    });

    it('should return default values if no incentives are found', async () => {
        const employeeId = '60c72b2f5f1b2c001c8e4cfb';
        const corporateUserId = 'validCorporateUserId';
        const month = 1;
        const year = 2023;

        const firstDayOfMonth = new Date(year, month - 1, 1);
        const firstDayOfNextMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(firstDayOfNextMonth - 1);

        Incentives.aggregate.mockResolvedValue([]);

        const result = await fetchIncentivesByEmployeeAndCorporateUser(employeeId, corporateUserId, month, year);

        expect(Incentives.aggregate).toHaveBeenCalledWith([
            {
                $match: {
                    employee: new mongoose.Types.ObjectId(employeeId),
                    corporateUser: corporateUserId,
                    incentiveDate: {
                        $gte: firstDayOfMonth,
                        $lte: lastDayOfMonth
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalIncentivesPay: { $sum: "$amount" },
                    incentivesIds: { $push: "$_id" }
                }
            }
        ]);

        expect(result).toEqual({ totalIncentivesPay: 0, incentivesIds: [] });
    });

    it('should handle errors gracefully', async () => {
        const employeeId = '60c72b2f5f1b2c001c8e4cfb';
        const corporateUserId = 'validCorporateUserId';
        const month = 1;
        const year = 2023;

        const mockError = new Error('Database error');

        Incentives.aggregate.mockRejectedValue(mockError);

        const result = await fetchIncentivesByEmployeeAndCorporateUser(employeeId, corporateUserId, month, year);

        expect(result).toEqual(mockError);
    });
});
