const { findAllFinancialDocsList } = require("../../cloud_financialDocs");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_documents', () => ({
    findAndCountAll: jest.fn(),
}));

describe('findAllFinancialDocsList Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return documents with only credentialId filter', async () => {
        const credentialId = 1;
        const documentsData = {
            count: 2,
            rows: [
                { id: 1, documentName: 'Document 1' },
                { id: 2, documentName: 'Document 2' },
            ],
        };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllFinancialDocsList(credentialId);

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            where: {
                credentialId: credentialId,
                documentCategory: "FINANCE",
            },
        });

        expect(result).toEqual({ success: true, data: documentsData });
    });

    it('should return documents with only subCorporateUserId filter', async () => {
        const subCorporateUserId = 2;
        const documentsData = {
            count: 1,
            rows: [
                { id: 3, documentName: 'Document 3' },
            ],
        };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllFinancialDocsList(null, subCorporateUserId);

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            where: {
                subCorporateUserId: subCorporateUserId,
                documentCategory: "FINANCE",
            },
        });

        expect(result).toEqual({ success: true, data: documentsData });
    });

    it('should return documents with both credentialId and subCorporateUserId filters', async () => {
        const credentialId = 1;
        const subCorporateUserId = 2;
        const documentsData = {
            count: 1,
            rows: [
                { id: 4, documentName: 'Document 4' },
            ],
        };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllFinancialDocsList(credentialId, subCorporateUserId);

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            where: {
                subCorporateUserId: subCorporateUserId,
                documentCategory: "FINANCE",
            },
        });

        expect(result).toEqual({ success: true, data: documentsData });
    });

    it('should return documents with no filters', async () => {
        const documentsData = {
            count: 3,
            rows: [
                { id: 5, documentName: 'Document 5' },
                { id: 6, documentName: 'Document 6' },
                { id: 7, documentName: 'Document 7' },
            ],
        };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllFinancialDocsList();

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            where: {
                documentCategory: "FINANCE",
            },
        });

        expect(result).toEqual({ success: true, data: documentsData });
    });

    it('should return an error if there is a database error', async () => {
        cloud_documents.findAndCountAll.mockRejectedValue(new Error('Database error'));

        const result = await findAllFinancialDocsList();

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
