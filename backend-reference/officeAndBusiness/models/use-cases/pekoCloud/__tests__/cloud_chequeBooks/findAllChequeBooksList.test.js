const { findAllChequeBooksList } = require("../../cloud_chequeBooks");
const cloud_chequeBooks = require("../../../../entities/pekoCloud/cloud_chequeBooks");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_chequeBooks.js', () => ({
    belongsTo: jest.fn(),
    findAndCountAll: jest.fn(),
}));

describe('findAllChequeBooksList Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully find cheque books by credentialId', async () => {
        const credentialId = 123;
        const mockChequeBooksData = { count: 2, rows: [{ id: 1 }, { id: 2 }] };

        cloud_chequeBooks.findAndCountAll.mockResolvedValue(mockChequeBooksData);

        const result = await findAllChequeBooksList(credentialId, null);

        expect(cloud_chequeBooks.findAndCountAll).toHaveBeenCalledWith({
            where: {
                credentialId: credentialId,
            },
        });

        expect(result).toEqual({ success: true, data: mockChequeBooksData });
    });

    it('should successfully find cheque books by subCorporateUserId', async () => {
        const subCorporateUserId = 1;
        const mockChequeBooksData = { count: 3, rows: [{ id: 1 }, { id: 2 }, { id: 3 }] };

        cloud_chequeBooks.findAndCountAll.mockResolvedValue(mockChequeBooksData);

        const result = await findAllChequeBooksList(null, subCorporateUserId);

        expect(cloud_chequeBooks.findAndCountAll).toHaveBeenCalledWith({
            where: {
                subCorporateUserId: subCorporateUserId,
            },
        });

        expect(result).toEqual({ success: true, data: mockChequeBooksData });
    });

    it('should handle case where no filters are applied', async () => {
        const mockChequeBooksData = { count: 4, rows: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] };

        cloud_chequeBooks.findAndCountAll.mockResolvedValue(mockChequeBooksData);

        const result = await findAllChequeBooksList(null, null);

        expect(cloud_chequeBooks.findAndCountAll).toHaveBeenCalledWith({
            where: {},
        });

        expect(result).toEqual({ success: true, data: mockChequeBooksData });
    });

    it('should handle unexpected errors', async () => {
        const errorMessage = 'Database connection error';

        cloud_chequeBooks.findAndCountAll.mockRejectedValue(new Error(errorMessage));

        const result = await findAllChequeBooksList(123, null);

        expect(cloud_chequeBooks.findAndCountAll).toHaveBeenCalledWith({
            where: {
                credentialId: 123,
            },
        });

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
