const { getTotalAssetsAndFleets } = require("../../cloud_dashboard");
const cloud_assets = require("../../../../entities/pekoCloud/cloud_assets");
const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");

jest.mock('../../../../entities/pekoCloud/cloud_assets.js', () => ({
    count: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_fleets.js', () => ({
    count: jest.fn(),
}));

jest.mock('../../../../entities/pekoCloud/cloud_documents.js', () => ({
    belongsTo: jest.fn(),
}));

describe('getTotalAssetsAndFleets Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the total count of assets and fleets for a given credentialId', async () => {
        const credentialId = 1;
        const assetsCount = 10;
        const fleetsCount = 5;
        const expectedTotal = assetsCount + fleetsCount;

        cloud_assets.count.mockResolvedValue(assetsCount);
        cloud_fleets.count.mockResolvedValue(fleetsCount);

        const result = await getTotalAssetsAndFleets(credentialId);

        expect(cloud_assets.count).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(cloud_fleets.count).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toBe(expectedTotal);
    });

    it('should return zero if there are no assets and fleets for the given credentialId', async () => {
        const credentialId = 2;
        const assetsCount = 0;
        const fleetsCount = 0;
        const expectedTotal = 0;

        cloud_assets.count.mockResolvedValue(assetsCount);
        cloud_fleets.count.mockResolvedValue(fleetsCount);

        const result = await getTotalAssetsAndFleets(credentialId);

        expect(cloud_assets.count).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(cloud_fleets.count).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toBe(expectedTotal);
    });

    it('should handle cases where only assets are present', async () => {
        const credentialId = 3;
        const assetsCount = 7;
        const fleetsCount = 0;
        const expectedTotal = assetsCount + fleetsCount;

        cloud_assets.count.mockResolvedValue(assetsCount);
        cloud_fleets.count.mockResolvedValue(fleetsCount);

        const result = await getTotalAssetsAndFleets(credentialId);

        expect(cloud_assets.count).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(cloud_fleets.count).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toBe(expectedTotal);
    });

    it('should handle cases where only fleets are present', async () => {
        const credentialId = 4;
        const assetsCount = 0;
        const fleetsCount = 8;
        const expectedTotal = assetsCount + fleetsCount;

        cloud_assets.count.mockResolvedValue(assetsCount);
        cloud_fleets.count.mockResolvedValue(fleetsCount);

        const result = await getTotalAssetsAndFleets(credentialId);

        expect(cloud_assets.count).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(cloud_fleets.count).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toBe(expectedTotal);
    });

    it('should handle errors when counting assets', async () => {
        const credentialId = 5;
        const error = new Error('Database error');

        cloud_assets.count.mockRejectedValue(error);
        cloud_fleets.count.mockResolvedValue(3);

        const result = await getTotalAssetsAndFleets(credentialId);

        expect(cloud_assets.count).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(cloud_fleets.count).not.toHaveBeenCalled();
        expect(result).toBe(error);
    });

    it('should handle errors when counting fleets', async () => {
        const credentialId = 6;
        const error = new Error('Database error');

        cloud_assets.count.mockResolvedValue(4);
        cloud_fleets.count.mockRejectedValue(error);

        const result = await getTotalAssetsAndFleets(credentialId);

        expect(cloud_assets.count).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(cloud_fleets.count).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toBe(error);
    });

    it('should handle unexpected errors gracefully', async () => {
        const credentialId = 7;

        cloud_assets.count.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = await getTotalAssetsAndFleets(credentialId);

        expect(cloud_assets.count).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(cloud_fleets.count).not.toHaveBeenCalled();
        expect(result).toEqual(new Error('Unexpected error'));
    });
});
