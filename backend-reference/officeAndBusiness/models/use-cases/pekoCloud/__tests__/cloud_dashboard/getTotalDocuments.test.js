const { getTotalDocuments } = require("../../cloud_dashboard");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");

jest.mock('../../../../entities/pekoCloud/cloud_documents.js', () => ({
    count: jest.fn(),
    findAndCountAll: jest.fn(),
}));

describe('getTotalDocuments Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the total count of documents for a given credentialId', async () => {
        const credentialId = 1;
        const expectedCount = 5;

        cloud_documents.findAndCountAll.mockResolvedValue({
            rows: Array(expectedCount).fill({ documentCategory: 'OTHER', documentNumber: '123', issueDate: new Date() }),
            count: expectedCount
        });

        const result = await getTotalDocuments(credentialId);

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toBe(expectedCount);
    });

    it('should return zero if there are no documents for the given credentialId', async () => {
        const credentialId = 2;
        const expectedCount = 0;

        cloud_documents.findAndCountAll.mockResolvedValue({
            rows: [],
            count: 0
        });

        const result = await getTotalDocuments(credentialId);

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toBe(expectedCount);
    });

    it('should handle errors when counting documents', async () => {
        const credentialId = 3;
        const error = new Error('Database error');

        cloud_documents.findAndCountAll.mockRejectedValue(error);

        const result = await getTotalDocuments(credentialId);

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toBe(error);
    });

    it('should handle unexpected errors gracefully', async () => {
        const credentialId = null;

        cloud_documents.findAndCountAll.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = await getTotalDocuments(credentialId);

        expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
            where: {},
        });
        expect(result).toEqual(new Error('Unexpected error'));
    });
});
