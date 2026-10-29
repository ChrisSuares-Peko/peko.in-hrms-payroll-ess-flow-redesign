const { findAllpayrollDocs } = require('../../payrollDocs');
const payrollDocs = require('../../../entities/payrollDocs');

jest.mock('../../../entities/payrollDocs');

describe('findAllpayrollDocs', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all active payroll documents', async () => {
        const mockResult = [
            { id: 1, documentName: 'Salary Slip', categoryId: 10 },
            { id: 2, documentName: 'Tax Form', categoryId: 20 },
        ];
        payrollDocs.findAll.mockResolvedValue(mockResult);

        const result = await findAllpayrollDocs();

        expect(payrollDocs.findAll).toHaveBeenCalledWith({
            attributes: ['id', 'documentName', 'categoryId'],
            where: { status: true },
        });
        expect(result).toEqual(mockResult);
    });

    it('should return empty array when no documents found', async () => {
        payrollDocs.findAll.mockResolvedValue([]);

        const result = await findAllpayrollDocs();
        expect(result).toEqual([]);
    });

    it('should return undefined on error (catches internally)', async () => {
        payrollDocs.findAll.mockRejectedValue(new Error('DB error'));

        const result = await findAllpayrollDocs();
        expect(result).toBeUndefined();
    });
});
