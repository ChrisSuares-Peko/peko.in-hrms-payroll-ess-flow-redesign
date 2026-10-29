const { findAllCompanyDocsList } = require("../../cloud_companyDocs");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_documents.js', () => ({
    belongsTo: jest.fn(),
    findAndCountAll: jest.fn(),
}));

describe('findAllCompanyDocsList Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully retrieve documents with a credentialId', async () => {
        const credentialId = 1;
        const documentsData = { count: 3, rows: [{ id: 1 }, { id: 2 }] };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllCompanyDocsList(credentialId);

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            where: { documentCategory: "COMPANY", credentialId },
        });
        expect(result).toEqual({
            success: true,
            data: documentsData,
        });
    });

    it('should successfully retrieve documents with a subCorporateUserId', async () => {
        const subCorporateUserId = 2;
        const documentsData = { count: 2, rows: [{ id: 1 }] };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllCompanyDocsList(null, subCorporateUserId);

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            where: { documentCategory: "COMPANY", subCorporateUserId },
        });
        expect(result).toEqual({
            success: true,
            data: documentsData,
        });
    });

    it('should successfully retrieve documents with both credentialId and subCorporateUserId', async () => {
        const credentialId = 1;
        const subCorporateUserId = 2;
        const documentsData = { count: 4, rows: [{ id: 1 }, { id: 2 }, { id: 3 }] };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllCompanyDocsList(credentialId, subCorporateUserId);

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            where: { documentCategory: "COMPANY", subCorporateUserId },
        });
        expect(result).toEqual({
            success: true,
            data: documentsData,
        });
    });

    it('should successfully retrieve documents without any parameters', async () => {
        const documentsData = { count: 5, rows: [{ id: 1 }, { id: 2 }] };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllCompanyDocsList();

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            where: { documentCategory: "COMPANY" },
        });
        expect(result).toEqual({
            success: true,
            data: documentsData,
        });
    });

    it('should handle unexpected errors', async () => {
        const credentialId = 1;

        cloud_documents.findAndCountAll.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = await findAllCompanyDocsList(credentialId);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
