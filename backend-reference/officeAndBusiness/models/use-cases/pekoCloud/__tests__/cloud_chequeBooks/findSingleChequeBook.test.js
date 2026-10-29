const { findSingleChequeBook } = require("../../cloud_chequeBooks");
const cloud_chequeBooks = require("../../../../entities/pekoCloud/cloud_chequeBooks");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_chequeBooks.js', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
}));

describe('findSingleChequeBook Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully find a cheque book', async () => {
        const id = 1;
        const mockChequeBook = { id, bookId: '123', accountName: 'Sample Account', accountNumber: '456', bankName: 'Sample Bank' };

        cloud_chequeBooks.findOne.mockResolvedValue(mockChequeBook);

        const result = await findSingleChequeBook(id);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({
            where: {
                id: id,
            },
        });

        expect(result).toEqual({ success: true, data: mockChequeBook });
    });

    it('should return an error if cheque book does not exist', async () => {
        const id = 1;

        cloud_chequeBooks.findOne.mockResolvedValue(null);

        const result = await findSingleChequeBook(id);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({
            where: {
                id: id,
            },
        });

        expect(result).toEqual({
            success: false,
            error: "Cheque Book with this details doesn't exists.",
        });
    });

    it('should handle unexpected errors', async () => {
        const id = 1;
        const errorMessage = 'Database connection error';

        cloud_chequeBooks.findOne.mockRejectedValue(new Error(errorMessage));

        const result = await findSingleChequeBook(id);

        expect(cloud_chequeBooks.findOne).toHaveBeenCalledWith({
            where: {
                id: id,
            },
        });

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
