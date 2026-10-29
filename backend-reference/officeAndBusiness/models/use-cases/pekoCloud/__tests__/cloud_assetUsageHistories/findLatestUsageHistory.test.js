const cloud_usageHistories = require('../../../../entities/pekoCloud/cloud_usageHistories');
const cloud_employees = require('../../../../entities/pekoCloud/cloud_employees');
const ErrorResponse = require('../../../../../utils/error-response');
const { findLatestUsageHistory } = require('../../cloud_assetUsageHistories');

jest.mock('../../../../entities/pekoCloud/cloud_assets.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_chequeBooks.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_documents.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_employees.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_fleets.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_maintenances.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_owners.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_softwares.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_subscriptions.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_usageHistories.js', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
}));

describe('findLatestUsageHistory Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully fetch the latest usage history', async () => {
        const mockUsageHistory = {
            id: 1,
            usageCategory: 'ASSET',
            assignDate: new Date(),
            returnDate: new Date(),
            returnStatus: 'Returned',
            remarks: 'Good condition',
            cloudEmployee: {
                id: 1,
                employeeName: 'John Doe',
                employeeEmail: 'john.doe@example.com',
                department: 'IT',
                joiningDate: new Date(),
                employeeID: 'EMP123'
            }
        };

        cloud_usageHistories.findOne.mockResolvedValue(mockUsageHistory);

        const result = await findLatestUsageHistory(1);

        expect(cloud_usageHistories.findOne).toHaveBeenCalledWith({
            include: [
                {
                    model: cloud_employees,
                    attributes: [
                        'id', 'employeeName', 'employeeEmail', 'department', 'joiningDate', 'employeeID',
                    ],
                },
            ],
            where: { cloudAssetId: 1 },
            order: [['createdAt', 'DESC']],
            limit: 1,
        });

        expect(result).toEqual({ success: true, data: mockUsageHistory });
    });

    it('should return success with null data if no usage history found', async () => {
        cloud_usageHistories.findOne.mockResolvedValue(null);

        const result = await findLatestUsageHistory(1);

        expect(cloud_usageHistories.findOne).toHaveBeenCalledWith({
            include: [
                {
                    model: cloud_employees,
                    attributes: [
                        'id', 'employeeName', 'employeeEmail', 'department', 'joiningDate', 'employeeID',
                    ],
                },
            ],
            where: { cloudAssetId: 1 },
            order: [['createdAt', 'DESC']],
            limit: 1,
        });

        expect(result).toEqual({ success: true, data: null });
    });

    it('should handle database errors', async () => {
        cloud_usageHistories.findOne.mockRejectedValue(new Error('Database error'));

        const result = await findLatestUsageHistory(1);

        expect(cloud_usageHistories.findOne).toHaveBeenCalledWith({
            include: [
                {
                    model: cloud_employees,
                    attributes: [
                        'id', 'employeeName', 'employeeEmail', 'department', 'joiningDate', 'employeeID',
                    ],
                },
            ],
            where: { cloudAssetId: 1 },
            order: [['createdAt', 'DESC']],
            limit: 1,
        });

        expect(result).toEqual(new ErrorResponse('Something went wrong, please try again later.', 500));
    });
});
