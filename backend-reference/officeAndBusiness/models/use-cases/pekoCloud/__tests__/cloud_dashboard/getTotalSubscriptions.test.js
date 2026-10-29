const { getTotalSubscriptions } = require("../../cloud_dashboard");
const cloud_subscriptions = require("../../../../entities/pekoCloud/cloud_subscriptions");

jest.mock('../../../../entities/pekoCloud/cloud_subscriptions.js', () => ({
    count: jest.fn(),
}));

describe('getTotalSubscriptions Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the total number of subscriptions for a given credentialId', async () => {
        const credentialId = 1;
        const expectedCount = 10;

        cloud_subscriptions.count.mockResolvedValue(expectedCount);

        const result = await getTotalSubscriptions(credentialId);

        expect(cloud_subscriptions.count).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toBe(expectedCount);
    });

    it('should handle errors gracefully', async () => {
        const credentialId = 2;
        const error = new Error('Database error');

        cloud_subscriptions.count.mockRejectedValue(error);

        const result = await getTotalSubscriptions(credentialId);

        expect(cloud_subscriptions.count).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toEqual(error);
    });

    it('should handle case when count returns zero', async () => {
        const credentialId = 3;
        const expectedCount = 0;

        cloud_subscriptions.count.mockResolvedValue(expectedCount);

        const result = await getTotalSubscriptions(credentialId);

        expect(cloud_subscriptions.count).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toBe(expectedCount);
    });

    it('should handle case when no credentialId is provided', async () => {
        const credentialId = null;
        const expectedCount = 0;

        cloud_subscriptions.count.mockResolvedValue(expectedCount);

        const result = await getTotalSubscriptions(credentialId);

        expect(cloud_subscriptions.count).toHaveBeenCalledWith({
            where: {},
        });
        expect(result).toBe(expectedCount);
    });

    it('should handle unexpected errors', async () => {
        const credentialId = 4;

        cloud_subscriptions.count.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const result = await getTotalSubscriptions(credentialId);

        expect(cloud_subscriptions.count).toHaveBeenCalledWith({
            where: { credentialId: credentialId },
        });
        expect(result).toEqual(new Error('Unexpected error'));
    });
});
