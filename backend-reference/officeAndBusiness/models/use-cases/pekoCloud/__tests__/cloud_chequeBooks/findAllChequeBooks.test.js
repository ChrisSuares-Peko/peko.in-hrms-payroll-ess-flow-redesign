const { findAllChequeBooks } = require("../../cloud_chequeBooks");
const cloud_chequeBooks = require("../../../../entities/pekoCloud/cloud_chequeBooks");
const ErrorResponse = require("../../../../../utils/error-response");
const { Op } = require("sequelize");

jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_chequeBooks.js', () => ({
    belongsTo: jest.fn(),
    findAndCountAll: jest.fn(),
}));

describe('findAllChequeBooks Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully retrieve cheque books with pagination, sorting, and filtering', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'accountName';
        const sort = 'ASC';
        const searchText = 'Sample';
        const credentialId = 123;
        const subCorporateUserId = null;

        const offset = (page - 1) * itemsPerPage;
        const mockChequeBooksData = {
            count: 2,
            rows: [
                { id: 1, accountName: 'Sample Account 1' },
                { id: 2, accountName: 'Sample Account 2' }
            ]
        };

        cloud_chequeBooks.findAndCountAll.mockResolvedValue(mockChequeBooksData);

        const result = await findAllChequeBooks(
            page,
            itemsPerPage,
            sortField,
            sort,
            searchText,
            credentialId,
            subCorporateUserId
        );

        expect(cloud_chequeBooks.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: offset,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { bookId: { [Op.like]: `%${searchText}%` } },
                    { accountName: { [Op.like]: `%${searchText}%` } },
                    { accountNumber: { [Op.like]: `%${searchText}%` } },
                    { bankName: { [Op.like]: `%${searchText}%` } },
                    { currency: { [Op.like]: `%${searchText}%` } },
                    { chequeStarting: { [Op.like]: `%${searchText}%` } },
                ],
                credentialId: credentialId,
            },
        });

        expect(result).toEqual({ success: true, data: mockChequeBooksData });
    });

    it('should retrieve cheque books with pagination and sorting only, without filters', async () => {
        const page = 2;
        const itemsPerPage = 5;
        const sortField = 'createdAt';
        const sort = 'DESC';
        const searchText = "";
        const credentialId = null;
        const subCorporateUserId = null;

        const offset = (page - 1) * itemsPerPage;
        const mockChequeBooksData = {
            count: 3,
            rows: [
                { id: 1, createdAt: '2024-01-01' },
                { id: 2, createdAt: '2024-01-02' },
                { id: 3, createdAt: '2024-01-03' }
            ]
        };

        cloud_chequeBooks.findAndCountAll.mockResolvedValue(mockChequeBooksData);

        const result = await findAllChequeBooks(
            page,
            itemsPerPage,
            sortField,
            sort,
            searchText,
            credentialId,
            subCorporateUserId
        );

        expect(cloud_chequeBooks.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: offset,
            order: [[sortField, sort]],
            where: {},
        });

        expect(result).toEqual({ success: true, data: mockChequeBooksData });
    });

    it('should handle case where search text is provided but no filters', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'accountName';
        const sort = 'ASC';
        const searchText = 'Sample';
        const credentialId = null;
        const subCorporateUserId = null;

        const offset = (page - 1) * itemsPerPage;
        const mockChequeBooksData = {
            count: 2,
            rows: [
                { id: 1, accountName: 'Sample Account' },
                { id: 2, accountName: 'Sample Account 2' }
            ]
        };

        cloud_chequeBooks.findAndCountAll.mockResolvedValue(mockChequeBooksData);

        const result = await findAllChequeBooks(
            page,
            itemsPerPage,
            sortField,
            sort,
            searchText,
            credentialId,
            subCorporateUserId
        );

        expect(cloud_chequeBooks.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: offset,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { bookId: { [Op.like]: `%${searchText}%` } },
                    { accountName: { [Op.like]: `%${searchText}%` } },
                    { accountNumber: { [Op.like]: `%${searchText}%` } },
                    { bankName: { [Op.like]: `%${searchText}%` } },
                    { currency: { [Op.like]: `%${searchText}%` } },
                    { chequeStarting: { [Op.like]: `%${searchText}%` } },
                ],
            },
        });

        expect(result).toEqual({ success: true, data: mockChequeBooksData });
    });

    it('should handle case where filters are applied but no search text', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'accountName';
        const sort = 'DESC';
        const searchText = "";
        const credentialId = 123;
        const subCorporateUserId = null;

        const offset = (page - 1) * itemsPerPage;
        const mockChequeBooksData = {
            count: 2,
            rows: [
                { id: 1, accountName: 'Account 1' },
                { id: 2, accountName: 'Account 2' }
            ]
        };

        cloud_chequeBooks.findAndCountAll.mockResolvedValue(mockChequeBooksData);

        const result = await findAllChequeBooks(
            page,
            itemsPerPage,
            sortField,
            sort,
            searchText,
            credentialId,
            subCorporateUserId
        );

        expect(cloud_chequeBooks.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: offset,
            order: [[sortField, sort]],
            where: {
                credentialId: credentialId,
            },
        });

        expect(result).toEqual({ success: true, data: mockChequeBooksData });
    });

    it('should handle unexpected errors', async () => {
        const page = 1;
        const itemsPerPage = 10;
        const sortField = 'accountName';
        const sort = 'ASC';
        const searchText = 'Sample';
        const credentialId = 123;
        const subCorporateUserId = 1;

        const errorMessage = 'Database error';

        cloud_chequeBooks.findAndCountAll.mockRejectedValue(new Error(errorMessage));

        const result = await findAllChequeBooks(
            page,
            itemsPerPage,
            sortField,
            sort,
            searchText,
            credentialId,
            subCorporateUserId
        );

        expect(cloud_chequeBooks.findAndCountAll).toHaveBeenCalledWith({
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            order: [[sortField, sort]],
            where: {
                [Op.or]: [
                    { bookId: { [Op.like]: `%${searchText}%` } },
                    { accountName: { [Op.like]: `%${searchText}%` } },
                    { accountNumber: { [Op.like]: `%${searchText}%` } },
                    { bankName: { [Op.like]: `%${searchText}%` } },
                    { currency: { [Op.like]: `%${searchText}%` } },
                    { chequeStarting: { [Op.like]: `%${searchText}%` } },
                ],
                subCorporateUserId: subCorporateUserId
            },
        });

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
