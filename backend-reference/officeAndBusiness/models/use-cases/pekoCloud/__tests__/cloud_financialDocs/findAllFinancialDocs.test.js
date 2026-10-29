const { findAllFinancialDocs } = require("../../cloud_financialDocs");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const ErrorResponse = require("../../../../../utils/error-response");
const { Op } = require("sequelize");

jest.mock('../../../../entities/pekoCloud/cloud_documents', () => ({
    findAndCountAll: jest.fn(),
}));

describe('findAllFinancialDocs Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return documents with pagination, sorting, and search text', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'documentName';
        const sort = 'ASC';
        const searchText = 'Financial';
        const credentialId = 1;
        const subCorporateUserId = 2;
        const documentsData = {
            count: 2,
            rows: [
                { id: 1, documentName: 'Financial Report', documentNumber: '1234', documentType: 'Report' },
                { id: 2, documentName: 'Annual Financial Statement', documentNumber: '5678', documentType: 'Statement' },
            ],
        };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllFinancialDocs(
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
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { documentName: { [Op.like]: `%${searchText}%` } },
                    { documentNumber: { [Op.like]: `%${searchText}%` } },
                    { documentType: { [Op.like]: `%${searchText}%` } },
                ],
                documentCategory: 'FINANCE',
                subCorporateUserId: subCorporateUserId,
            },
        });

        expect(result).toEqual({ success: true, data: documentsData });
    });

    it('should return documents with only search text filter', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'documentName';
        const sort = 'ASC';
        const searchText = 'Financial';
        const documentsData = {
            count: 2,
            rows: [
                { id: 1, documentName: 'Financial Report', documentNumber: '1234', documentType: 'Report' },
                { id: 2, documentName: 'Annual Financial Statement', documentNumber: '5678', documentType: 'Statement' },
            ],
        };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllFinancialDocs(
            page,
            itemsPerPage,
            sortField,
            sort,
            searchText
        );

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { documentName: { [Op.like]: `%${searchText}%` } },
                    { documentNumber: { [Op.like]: `%${searchText}%` } },
                    { documentType: { [Op.like]: `%${searchText}%` } },
                ],
                documentCategory: 'FINANCE',
            },
        });

        expect(result).toEqual({ success: true, data: documentsData });
    });

    it('should return documents with only pagination and sorting', async () => {
        const page = 2;
        const itemsPerPage = 5;
        const sortField = 'createdAt';
        const sort = 'DESC';
        const documentsData = {
            count: 15,
            rows: [
                { id: 6, documentName: 'Document 6', documentNumber: '9012', documentType: 'Report' },
                { id: 7, documentName: 'Document 7', documentNumber: '3456', documentType: 'Statement' },
            ],
        };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllFinancialDocs(
            page,
            itemsPerPage,
            sortField,
            sort
        );

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                documentCategory: 'FINANCE',
            },
        });

        expect(result).toEqual({ success: true, data: documentsData });
    });

    it('should return documents with only credentialId filter', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'documentName';
        const sort = 'ASC';
        const credentialId = 1;
        const documentsData = {
            count: 2,
            rows: [
                { id: 1, documentName: 'Document 1', documentNumber: '1234', documentType: 'Report' },
                { id: 2, documentName: 'Document 2', documentNumber: '5678', documentType: 'Statement' },
            ],
        };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllFinancialDocs(
            page,
            itemsPerPage,
            sortField,
            sort,
            null,
            credentialId
        );

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                documentCategory: 'FINANCE',
                credentialId: credentialId,
            },
        });

        expect(result).toEqual({ success: true, data: documentsData });
    });

    it('should return documents with only subCorporateUserId filter', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'documentName';
        const sort = 'ASC';
        const subCorporateUserId = 2;
        const documentsData = {
            count: 1,
            rows: [
                { id: 3, documentName: 'Document 3', documentNumber: '6789', documentType: 'Report' },
            ],
        };

        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await findAllFinancialDocs(
            page,
            itemsPerPage,
            sortField,
            sort,
            null,
            null,
            subCorporateUserId
        );

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                documentCategory: 'FINANCE',
                subCorporateUserId: subCorporateUserId,
            },
        });

        expect(result).toEqual({ success: true, data: documentsData });
    });

    it('should handle errors and return appropriate error response', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'documentName';
        const sort = 'ASC';
        const searchText = 'Financial';

        cloud_documents.findAndCountAll.mockRejectedValue(new Error('Database error'));

        const result = await findAllFinancialDocs(
            page,
            itemsPerPage,
            sortField,
            sort,
            searchText
        );

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
