const { countAllFinancialDocs } = require("../../cloud_financialDocs");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_documents', () => ({
    count: jest.fn(),
}));

describe('countAllFinancialDocs Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return document count with credentialId filter', async () => {
        const credentialId = 1;
        cloud_documents.count.mockResolvedValue(5);

        const result = await countAllFinancialDocs(credentialId);

        expect(cloud_documents.count).toHaveBeenCalledWith({
            where: {
                documentCategory: 'FINANCE',
                credentialId: credentialId,
            },
        });
        expect(result).toEqual({ success: true, data: 5 });
    });

    it('should return document count with subCorporateUserId filter (overrides credentialId)', async () => {
        const credentialId = 1;
        const subCorporateUserId = 2;
        cloud_documents.count.mockResolvedValue(3);

        const result = await countAllFinancialDocs(credentialId, subCorporateUserId);

        expect(cloud_documents.count).toHaveBeenCalledWith({
            where: {
                documentCategory: 'FINANCE',
                subCorporateUserId: subCorporateUserId,
            },
        });
        expect(result).toEqual({ success: true, data: 3 });
    });

    it('should return document count with only subCorporateUserId', async () => {
        const subCorporateUserId = 2;
        cloud_documents.count.mockResolvedValue(7);

        const result = await countAllFinancialDocs(null, subCorporateUserId);

        expect(cloud_documents.count).toHaveBeenCalledWith({
            where: {
                documentCategory: 'FINANCE',
                subCorporateUserId: subCorporateUserId,
            },
        });
        expect(result).toEqual({ success: true, data: 7 });
    });

    it('should return document count without any user filter', async () => {
        cloud_documents.count.mockResolvedValue(10);

        const result = await countAllFinancialDocs();

        expect(cloud_documents.count).toHaveBeenCalledWith({
            where: {
                documentCategory: 'FINANCE',
            },
        });
        expect(result).toEqual({ success: true, data: 10 });
    });

    it('should return zero count when no documents exist', async () => {
        cloud_documents.count.mockResolvedValue(0);

        const result = await countAllFinancialDocs(1);

        expect(cloud_documents.count).toHaveBeenCalled();
        expect(result).toEqual({ success: true, data: 0 });
    });

    it('should handle errors and return appropriate error response', async () => {
        cloud_documents.count.mockRejectedValue(new Error('Database error'));

        const result = await countAllFinancialDocs(1);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
