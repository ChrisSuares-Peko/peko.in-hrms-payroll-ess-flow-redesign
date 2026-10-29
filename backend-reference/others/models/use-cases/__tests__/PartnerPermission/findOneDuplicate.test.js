const { findOneDuplicate } = require('../../partnerPermission');
const partnerPermission = require('../../../entities/partnerPermission');
const { Op } = require('sequelize');

jest.mock('../../../entities/partnerPermission', () => ({
    findOne: jest.fn(),
}));

describe('findOneDuplicate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find a duplicate entry when ID is not provided', async () => {
        const mockRegisteredBy = 'user123';
        const mockResult = { id: 2, registeredBy: 'user123', permission: 'test_permission' };

        partnerPermission.findOne.mockResolvedValue(mockResult);

        const result = await findOneDuplicate(mockRegisteredBy);

        expect(partnerPermission.findOne).toHaveBeenCalledWith({
            where: { registeredBy: mockRegisteredBy },
            nest: true,
            raw: true,
        });
        expect(result).toEqual(mockResult);
    });

    it('should find a duplicate entry excluding the specified ID', async () => {
        const mockRegisteredBy = 'user123';
        const mockId = 1;
        const mockResult = { id: 2, registeredBy: 'user123', permission: 'test_permission' };

        partnerPermission.findOne.mockResolvedValue(mockResult);

        const result = await findOneDuplicate(mockRegisteredBy, mockId);

        expect(partnerPermission.findOne).toHaveBeenCalledWith({
            where: {
                registeredBy: mockRegisteredBy,
                id: { [Op.ne]: mockId },
            },
            nest: true,
            raw: true,
        });
        expect(result).toEqual(mockResult);
    });

    it('should return null if no duplicate entry is found', async () => {
        const mockRegisteredBy = 'user123';
        const mockId = 1;

        partnerPermission.findOne.mockResolvedValue(null);

        const result = await findOneDuplicate(mockRegisteredBy, mockId);

        expect(partnerPermission.findOne).toHaveBeenCalledWith({
            where: {
                registeredBy: mockRegisteredBy,
                id: { [Op.ne]: mockId },
            },
            nest: true,
            raw: true,
        });
        expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
        const mockRegisteredBy = 'user123';
        const mockError = new Error('Database error');

        partnerPermission.findOne.mockRejectedValue(mockError);

        await expect(findOneDuplicate(mockRegisteredBy)).rejects.toThrow('Database error');

        expect(partnerPermission.findOne).toHaveBeenCalledWith({
            where: { registeredBy: mockRegisteredBy },
            nest: true,
            raw: true,
        });
    });
});
