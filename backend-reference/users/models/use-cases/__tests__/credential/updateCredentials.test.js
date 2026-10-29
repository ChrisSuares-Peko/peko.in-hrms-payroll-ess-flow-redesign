const { updateCredentials } = require('../../credential');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/credential', () => ({
    update: jest.fn(),
}));

describe('credential - updateCredentials', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    it('should update credential by id', async () => {
        credential.update.mockResolvedValue([1]);

        const result = await updateCredentials(1, { name: 'Updated Name' });

        expect(credential.update).toHaveBeenCalledWith(
            { name: 'Updated Name' },
            { where: { id: 1 } }
        );
        expect(result).toEqual([1]);
    });

    it('should return [0] when no credential matches', async () => {
        credential.update.mockResolvedValue([0]);

        const result = await updateCredentials(999, { name: 'Test' });

        expect(result).toEqual([0]);
    });

    it('should handle errors gracefully', async () => {
        credential.update.mockRejectedValue(new Error('DB error'));

        const result = await updateCredentials(1, { name: 'Test' });

        expect(result).toBeUndefined();
        expect(console.log).toHaveBeenCalled();
    });
});
