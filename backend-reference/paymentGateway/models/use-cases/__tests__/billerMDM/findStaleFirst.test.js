const { Op } = require('sequelize');
const billerMDM = require('../../../entities/billerMDM');
const { findStaleFirst } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    findAll: jest.fn(),
}));

describe('findStaleFirst', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should put never-fetched billerIds first', async () => {
        billerMDM.findAll.mockResolvedValue([
            { billerId: 'B001', updatedAt: new Date('2024-01-01') },
            { billerId: 'B002', updatedAt: new Date('2024-01-02') },
        ]);
        const result = await findStaleFirst(['B001', 'B002', 'B003']);
        expect(result[0]).toBe('B003');
    });

    it('should return never-fetched first, then DB records in order', async () => {
        billerMDM.findAll.mockResolvedValue([
            { billerId: 'B001', updatedAt: new Date() },
            { billerId: 'B002', updatedAt: new Date() },
        ]);
        const result = await findStaleFirst(['B001', 'B002', 'B003']);
        expect(result).toEqual(['B003', 'B001', 'B002']);
    });

    it('should return all as never-fetched when DB returns empty', async () => {
        billerMDM.findAll.mockResolvedValue([]);
        const result = await findStaleFirst(['B001', 'B002']);
        expect(result).toEqual(['B001', 'B002']);
    });

    it('should return only DB records when all billerIds are in DB', async () => {
        billerMDM.findAll.mockResolvedValue([
            { billerId: 'B001', updatedAt: new Date() },
        ]);
        const result = await findStaleFirst(['B001']);
        expect(result).toEqual(['B001']);
    });

    it('should query with Op.in where clause and correct attributes', async () => {
        billerMDM.findAll.mockResolvedValue([]);
        await findStaleFirst(['B001', 'B002']);
        expect(billerMDM.findAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { billerId: { [Op.in]: ['B001', 'B002'] } },
                attributes: ['billerId', 'data', 'updatedAt'],
            })
        );
    });

    it('should throw on DB error', async () => {
        billerMDM.findAll.mockRejectedValue(new Error('DB error'));
        await expect(findStaleFirst(['B001'])).rejects.toThrow('DB error');
    });
});
