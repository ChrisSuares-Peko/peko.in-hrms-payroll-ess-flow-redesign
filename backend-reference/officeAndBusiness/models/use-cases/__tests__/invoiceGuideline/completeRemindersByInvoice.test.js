const { completeRemindersByInvoice } = require('../../invoiceGuideline');
const invoiceGuideline = require('../../../entities/invoiceGuideline');

jest.mock('../../../entities/invoiceGuideline', () => ({
    update: jest.fn(),
}));

describe('completeRemindersByInvoice', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call invoiceGuideline.update with status COMPLETED and where invoiceId and PENDING', async () => {
        const invoiceId = 123;
        invoiceGuideline.update.mockResolvedValue([1]);

        await completeRemindersByInvoice(invoiceId);

        expect(invoiceGuideline.update).toHaveBeenCalledWith(
            { status: 'COMPLETED' },
            { where: { invoiceId: 123, status: 'PENDING' } }
        );
    });

    it('should return the result from update', async () => {
        const invoiceId = 123;
        invoiceGuideline.update.mockResolvedValue([1]);

        const result = await completeRemindersByInvoice(invoiceId);

        expect(result).toEqual([1]);
    });

    it('should throw "Database error while completing reminders" when update throws', async () => {
        const invoiceId = 456;
        invoiceGuideline.update.mockRejectedValue(new Error('Some DB error'));

        await expect(completeRemindersByInvoice(invoiceId)).rejects.toThrow(
            'Database error while completing reminders'
        );
    });
});
