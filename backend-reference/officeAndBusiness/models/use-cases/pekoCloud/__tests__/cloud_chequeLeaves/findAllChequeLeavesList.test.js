const { findAllChequeLeavesList } = require("../../cloud_chequeLeaves");
const cloud_chequeLeaves = require("../../../../entities/pekoCloud/cloud_chequeLeaves");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
    belongsTo: jest.fn(),
    findAndCountAll: jest.fn(),
}));

describe('findAllChequeLeavesList Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully find all cheque leaves with credentialId filter', async () => {
        const credentialId = 1;
        const chequeLeavesData = { count: 2, rows: [{ id: 1 }, { id: 2 }] };

        cloud_chequeLeaves.findAndCountAll.mockResolvedValue(chequeLeavesData);

        const result = await findAllChequeLeavesList(credentialId, null);

        expect(cloud_chequeLeaves.findAndCountAll).toHaveBeenCalledWith({
            where: { credentialId },
        });
        expect(result).toEqual({ success: true, data: chequeLeavesData });
    });

    it('should successfully find all cheque leaves with subCorporateUserId filter', async () => {
        const subCorporateUserId = 2;
        const chequeLeavesData = { count: 1, rows: [{ id: 3 }] };

        cloud_chequeLeaves.findAndCountAll.mockResolvedValue(chequeLeavesData);

        const result = await findAllChequeLeavesList(null, subCorporateUserId);

        expect(cloud_chequeLeaves.findAndCountAll).toHaveBeenCalledWith({
            where: { subCorporateUserId },
        });
        expect(result).toEqual({ success: true, data: chequeLeavesData });
    });

    it('should successfully find all cheque leaves with no filters', async () => {
        const chequeLeavesData = { count: 3, rows: [{ id: 1 }, { id: 2 }, { id: 3 }] };

        cloud_chequeLeaves.findAndCountAll.mockResolvedValue(chequeLeavesData);

        const result = await findAllChequeLeavesList(null, null);

        expect(cloud_chequeLeaves.findAndCountAll).toHaveBeenCalledWith({
            where: {},
        });
        expect(result).toEqual({ success: true, data: chequeLeavesData });
    });

    it('should handle unexpected errors', async () => {
        const credentialId = 1;
        const subCorporateUserId = 2;

        cloud_chequeLeaves.findAndCountAll.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = await findAllChequeLeavesList(credentialId, subCorporateUserId);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
