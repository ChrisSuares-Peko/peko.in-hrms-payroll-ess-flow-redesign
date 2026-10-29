const { findConnected } = require('../../../use-cases/peko_connect');
const connections = require('../../../entities/connections');

jest.mock('../../../entities/connections', () => ({
    findAll: jest.fn(),
}));

describe('findConnected', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all connections for a given credential ID ordered by createdAt DESC', async () => {
        const mockParams = { id: 1 };
        const mockResponse = [
            { id: 1, credentialId: 1, serviceType: 'Internet', createdAt: new Date('2024-01-10T10:00:00Z') },
            { id: 2, credentialId: 1, serviceType: 'Electricity', createdAt: new Date('2024-01-09T12:00:00Z') },
        ];

        connections.findAll.mockResolvedValue(mockResponse);

        const result = await findConnected(mockParams);

        expect(connections.findAll).toHaveBeenCalledWith({
            where: { credentialId: mockParams.id },
            order: [['createdAt', 'DESC']],
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return an empty array when no connections are found', async () => {
        const mockParams = { id: 999 };
        connections.findAll.mockResolvedValue([]);

        const result = await findConnected(mockParams);

        expect(result).toEqual([]);
    });

    it('should throw an error when findAll fails', async () => {
        const mockParams = { id: 3 };
        const mockError = new Error('Database error');

        connections.findAll.mockRejectedValue(mockError);

        await expect(findConnected(mockParams)).rejects.toThrow('Database error');
    });
});
