const { findAllCompanyDocs } = require("../../cloud_companyDocs");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const { Op } = require("sequelize");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_documents.js', () => ({
    belongsTo: jest.fn(),
    findAndCountAll: jest.fn(),
}));

describe('findAllCompanyDocs Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully retrieve documents with pagination, sorting, and search text', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'documentName';
        const sort = 'ASC';
        const searchText = 'Doc';
        const credentialId = 1;
        const subCorporateUserId = null;
        const offset = (page - 1) * itemsPerPage;
        const documentsData = { count: 3, rows: [{ id: 1 }, { id: 2 }] };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllCompanyDocs(
            page,
            itemsPerPage,
            sortField,
            sort,
            searchText,
            credentialId,
            subCorporateUserId
        );

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: offset,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { documentName: { [Op.like]: `%${searchText}%` } },
                    { documentNumber: { [Op.like]: `%${searchText}%` } },
                    { documentType: { [Op.like]: `%${searchText}%` } },
                ],
                documentCategory: "COMPANY",
                credentialId,
            },
        });
        expect(result).toEqual({
            success: true,
            data: documentsData,
        });
    });

    it('should successfully retrieve documents with pagination and sorting without search text', async () => {
        const page = 2;
        const itemsPerPage = 5;
        const sortField = 'createdAt';
        const sort = 'DESC';
        const searchText = "";
        const credentialId = null;
        const subCorporateUserId = null;
        const offset = (page - 1) * itemsPerPage;
        const documentsData = { count: 2, rows: [{ id: 1 }] };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllCompanyDocs(
            page,
            itemsPerPage,
            sortField,
            sort,
            searchText,
            credentialId,
            subCorporateUserId
        );

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: offset,
            order: [[sortField, sort]],
            where: {
                documentCategory: "COMPANY",
            },
        });
        expect(result).toEqual({
            success: true,
            data: documentsData,
        });
    });

    it('should successfully retrieve documents with pagination and filtering by subCorporateUserId', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'documentNumber';
        const sort = 'ASC';
        const searchText = "";
        const credentialId = null;
        const subCorporateUserId = 3;
        const offset = (page - 1) * itemsPerPage;
        const documentsData = { count: 4, rows: [{ id: 1 }, { id: 2 }] };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllCompanyDocs(
            page,
            itemsPerPage,
            sortField,
            sort,
            searchText,
            credentialId,
            subCorporateUserId
        );

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: offset,
            order: [[sortField, sort]],
            where: {
                documentCategory: "COMPANY",
                subCorporateUserId,
            },
        });
        expect(result).toEqual({
            success: true,
            data: documentsData,
        });
    });

    it('should successfully retrieve documents with both search text and subCorporateUserId', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'documentType';
        const sort = 'DESC';
        const searchText = 'Report';
        const credentialId = null;
        const subCorporateUserId = 2;
        const offset = (page - 1) * itemsPerPage;
        const documentsData = { count: 5, rows: [{ id: 1 }, { id: 2 }] };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllCompanyDocs(
            page,
            itemsPerPage,
            sortField,
            sort,
            searchText,
            credentialId,
            subCorporateUserId
        );

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: offset,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { documentName: { [Op.like]: `%${searchText}%` } },
                    { documentNumber: { [Op.like]: `%${searchText}%` } },
                    { documentType: { [Op.like]: `%${searchText}%` } },
                ],
                documentCategory: "COMPANY",
                subCorporateUserId,
            },
        });
        expect(result).toEqual({
            success: true,
            data: documentsData,
        });
    });

    it('should handle unexpected errors', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'documentName';
        const sort = 'ASC';
        const searchText = "";
        const credentialId = 1;
        const subCorporateUserId = null;

        cloud_documents.findAndCountAll.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = await findAllCompanyDocs(
            page,
            itemsPerPage,
            sortField,
            sort,
            searchText,
            credentialId,
            subCorporateUserId
        );

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
