const { getReimbursements } = require('../../../use-cases/reimbursement');
const Reimbursement = require('../../../entities/reimbursement');
const mongoose = require('mongoose');

jest.mock('../../../entities/reimbursement');

describe('getReimbursements', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return reimbursements within the specified conditions', async () => {
        const corporateUserID = 'validCorporateUserID';
        const page = 1;
        const limit = 10;
        const year = 2023;
        const month = 8;
        const searchText = 'pending';

        const mockRows = [
            {
                _id: new mongoose.Types.ObjectId(),
                managerEmail: 'manager@example.com',
                paymentStatus: 'Pending',
                expenseDate: new Date('2023-08-15T00:00:00Z')
            }
        ];

        Reimbursement.aggregate.mockResolvedValue([{
            rows: mockRows,
            count: [{ total: 2 }]
        }]);

        const result = await getReimbursements(corporateUserID, page, limit, year, month, searchText);

        expect(Reimbursement.aggregate).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    $match: expect.objectContaining({
                        corporateUser: corporateUserID,
                        expenseDate: {
                            $gte: new Date(year, month - 1, 1),
                            $lt: new Date(year, month, 1)
                        }
                    })
                })
            ])
        );

        expect(result).toEqual({
            rows: mockRows,
            count: 2
        });
    });

    it('should return reimbursements without date filters', async () => {
        const corporateUserID = 'validCorporateUserID';
        const page = 1;
        const limit = 10;
        const searchText = 'pending';

        const mockRows = [
            {
                _id: new mongoose.Types.ObjectId(),
                managerEmail: 'manager@example.com',
                paymentStatus: 'Pending'
            }
        ];

        Reimbursement.aggregate.mockResolvedValue([{
            rows: mockRows,
            count: [{ total: 2 }]
        }]);

        const result = await getReimbursements(corporateUserID, page, limit, null, null, searchText);

        expect(Reimbursement.aggregate).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    $match: expect.objectContaining({ corporateUser: corporateUserID })
                })
            ])
        );

        expect(result).toEqual({
            rows: mockRows,
            count: 2
        });
    });

    it('should sort by newest first, before the pagination facet', async () => {
        const corporateUserID = 'validCorporateUserID';

        Reimbursement.aggregate.mockResolvedValue([{ rows: [], count: [] }]);

        await getReimbursements(corporateUserID, 1, 10, null, null, '');

        const pipeline = Reimbursement.aggregate.mock.calls[0][0];
        const sortIndex = pipeline.findIndex(stage => stage.$sort);
        const facetIndex = pipeline.findIndex(stage => stage.$facet);

        expect(pipeline[sortIndex]).toEqual({ $sort: { createdAt: -1 } });
        expect(sortIndex).toBeGreaterThanOrEqual(0);
        expect(sortIndex).toBeLessThan(facetIndex);
    });

    it('should handle errors gracefully', async () => {
        const corporateUserID = 'validCorporateUserID';
        const page = 1;
        const limit = 10;
        const year = 2023;
        const month = 8;
        const searchText = 'pending';

        const mockError = new Error('Database error');

        Reimbursement.aggregate.mockRejectedValue(mockError);

        await expect(
            getReimbursements(corporateUserID, page, limit, year, month, searchText)
        ).rejects.toThrow('Database error');
    });
});
