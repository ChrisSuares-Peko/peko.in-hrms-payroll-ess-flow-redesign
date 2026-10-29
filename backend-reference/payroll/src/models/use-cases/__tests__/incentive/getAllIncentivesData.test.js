const { getAllIncentivesData } = require('../../../use-cases/incentives');
const Incentives = require('../../../entities/incentives'); 

jest.mock('../../../entities/incentives');

describe('getAllIncentivesData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return incentives data and total count for valid params', async () => {
        const params = {
            page: 1,
            limit: 10,
            searchText: 'paid',
            corporateUserID: 'validCorporateUserId',
            employeeId: 'validEmployeeId',
            month: 7,
            year: 2023,
        };

        const mockIncentivesData = [
            {
                paymentStatus: 'Paid',
                incentiveDate: new Date(),
                corporateUser: params.corporateUserID,
                employee: params.employeeId,
            },
        ];

        const mockTotalCount = 1;

        Incentives.find.mockReturnValue({
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(mockIncentivesData),
        });

        Incentives.countDocuments.mockResolvedValue(mockTotalCount);

        const result = await getAllIncentivesData(params);

        expect(Incentives.find).toHaveBeenCalledWith({
            corporateUser: params.corporateUserID,
            employee: params.employeeId,
            incentiveDate: {
                $gte: new Date(2023, 6, 1),
                $lte: new Date(new Date(2023, 7, 1) - 1),
            },
        });

        expect(Incentives.find().skip).toHaveBeenCalledWith(0);
        expect(Incentives.find().limit).toHaveBeenCalledWith(10);
        expect(Incentives.find().exec).toHaveBeenCalled();

        expect(Incentives.countDocuments).toHaveBeenCalledWith({
            corporateUser: params.corporateUserID,
            employee: params.employeeId,
            incentiveDate: {
                $gte: new Date(2023, 6, 1),
                $lte: new Date(new Date(2023, 7, 1) - 1),
            },
        });

        expect(result).toEqual({
            totalCount: mockTotalCount,
            incentivesData: mockIncentivesData,
        });
    });

    it('should handle errors gracefully', async () => {
        const params = {
            page: 1,
            limit: 10,
            searchText: 'paid',
            corporateUserID: 'validCorporateUserId',
            employeeId: 'validEmployeeId',
        };

        const mockError = new Error('Database error');

        Incentives.find.mockReturnValue({
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            exec: jest.fn().mockRejectedValue(mockError),
        });

        const result = await getAllIncentivesData(params);

        expect(result).toEqual(mockError);
    });
});
