const { getFinancialInfo } = require("../../cloud_chequeLeaves");
const cloud_chequeLeaves = require("../../../../entities/pekoCloud/cloud_chequeLeaves");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
    belongsTo: jest.fn(),
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_documents.js', () => ({
    belongsTo: jest.fn(),
    findAndCountAll: jest.fn(),
}));

describe('getFinancialInfo Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully get financial info with a credentialId', async () => {
        const credentialId = 1;
        const chequeLeavesData = { count: 5, rows: [{ id: 1 }, { id: 2 }] };
        const documentsData = { count: 3, rows: [{ id: 1 }, { id: 2 }] };

        cloud_chequeLeaves.findAndCountAll.mockResolvedValue(chequeLeavesData);
        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await getFinancialInfo(credentialId);

        expect(cloud_chequeLeaves.findAndCountAll).toHaveBeenCalledWith({
            where: { credentialId },
        });
        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            where: { credentialId, documentCategory: "FINANCE" },
        });
        expect(result).toEqual({
            success: true,
            data: { chequeLeaves: chequeLeavesData, financials: documentsData },
        });
    });

    it('should successfully get financial info without a credentialId', async () => {
        const chequeLeavesData = { count: 5, rows: [{ id: 1 }, { id: 2 }] };
        const documentsData = { count: 3, rows: [{ id: 1 }, { id: 2 }] };

        cloud_chequeLeaves.findAndCountAll.mockResolvedValue(chequeLeavesData);
        cloud_documents.findAndCountAll.mockResolvedValue(documentsData);

        const result = await getFinancialInfo();

        expect(cloud_chequeLeaves.findAndCountAll).toHaveBeenCalledWith({
            where: {},
        });
        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            where: { documentCategory: "FINANCE" },
        });
        expect(result).toEqual({
            success: true,
            data: { chequeLeaves: chequeLeavesData, financials: documentsData },
        });
    });

    it('should handle unexpected errors', async () => {
        const credentialId = 1;

        cloud_chequeLeaves.findAndCountAll.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = await getFinancialInfo(credentialId);

        expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
    });
});
