const { deleteChequeLeaf } = require("../../cloud_chequeLeaves");
const cloud_chequeLeaves = require("../../../../entities/pekoCloud/cloud_chequeLeaves");
const { deleteEncryptedFromS3 } = require("../../../../../utils/s3");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
    belongsTo: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
}));

jest.mock('../../../../../utils/s3', () => ({
    deleteEncryptedFromS3: jest.fn(),
}));

describe('deleteChequeLeaf Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully delete a cheque leaf with a document', async () => {
        const id = 1;
        const chequeLeafData = { id, document: 'fileKey' };

        cloud_chequeLeaves.findOne.mockResolvedValue(chequeLeafData);
        deleteEncryptedFromS3.mockResolvedValue();
        cloud_chequeLeaves.destroy.mockResolvedValue(1);

        const result = await deleteChequeLeaf(id);

        expect(cloud_chequeLeaves.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(deleteEncryptedFromS3).toHaveBeenCalledWith(chequeLeafData.document);
        expect(cloud_chequeLeaves.destroy).toHaveBeenCalledWith({ where: { id } });
        expect(result).toEqual({ success: true, data: {} });
    });

    it('should handle the case where the cheque leaf does not exist', async () => {
        const id = 1;

        cloud_chequeLeaves.findOne.mockResolvedValue(null);

        const result = await deleteChequeLeaf(id);

        expect(cloud_chequeLeaves.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(result).toEqual({
            success: false,
            error: "cheque leaf is not existing with the given details",
        });
    });

    it('should handle the case where the cheque leaf exists but delete fails', async () => {
        const id = 1;
        const chequeLeafData = { id, document: 'fileKey' };

        cloud_chequeLeaves.findOne.mockResolvedValue(chequeLeafData);
        cloud_chequeLeaves.destroy.mockResolvedValue(0); // No rows deleted

        const result = await deleteChequeLeaf(id);

        expect(cloud_chequeLeaves.findOne).toHaveBeenCalledWith({ where: { id } });
        expect(deleteEncryptedFromS3).toHaveBeenCalledWith(chequeLeafData.document);
        expect(cloud_chequeLeaves.destroy).toHaveBeenCalledWith({ where: { id } });
        expect(result).toEqual({
            success: false,
            error: "cheque leaf is not able to delete try again",
        });
    });

    it('should handle unexpected errors', async () => {
        const id = 1;

        cloud_chequeLeaves.findOne.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = await deleteChequeLeaf(id);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
