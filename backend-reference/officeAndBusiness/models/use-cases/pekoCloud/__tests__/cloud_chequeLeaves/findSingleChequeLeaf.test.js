const { findSingleChequeLeaf } = require("../../cloud_chequeLeaves");
const cloud_chequeLeaves = require("../../../../entities/pekoCloud/cloud_chequeLeaves");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
}));

describe('findSingleChequeLeaf Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully find a cheque leaf', async () => {
        const id = 1;
        const chequeLeaf = { id, chequeBookNumber: '12345', chequeNumber: '67890' };

        cloud_chequeLeaves.findOne.mockResolvedValue(chequeLeaf);

        const result = await findSingleChequeLeaf(id);

        expect(cloud_chequeLeaves.findOne).toHaveBeenCalledWith({
            where: { id },
        });
        expect(result).toEqual({ success: true, data: chequeLeaf });
    });

    it('should return error if cheque leaf does not exist', async () => {
        const id = 1;

        cloud_chequeLeaves.findOne.mockResolvedValue(null);

        const result = await findSingleChequeLeaf(id);

        expect(cloud_chequeLeaves.findOne).toHaveBeenCalledWith({
            where: { id },
        });
        expect(result).toEqual({
            success: false,
            error: "Cheque Leaf with this details doesn't exists.",
        });
    });

    it('should handle unexpected errors', async () => {
        const id = 1;

        cloud_chequeLeaves.findOne.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = await findSingleChequeLeaf(id);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
