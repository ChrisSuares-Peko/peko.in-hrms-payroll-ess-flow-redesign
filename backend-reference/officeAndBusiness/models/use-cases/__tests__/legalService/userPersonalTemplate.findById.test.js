const { findById } = require('../../userPersonalTemplate');
const userPersonalTemplate = require('../../../entities/userPersonalTemplate');

jest.mock('../../../entities/userPersonalTemplate');

describe('userPersonalTemplate - findById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a personal template when found by ID', async () => {
        const mockTemplate = {
            id: 1,
            corporateUserId: 10,
            subCorporateUserId: null,
            title: 'My Custom NDA',
            iconKey: 'nda',
            category: 'Legal',
            timeEstimate: '20 mins',
            html: '<p>Agreement between {{Party Name}} and...</p>',
        };

        userPersonalTemplate.findOne.mockResolvedValue(mockTemplate);

        const result = await findById(1);

        expect(userPersonalTemplate.findOne).toHaveBeenCalledWith({
            where: { id: 1 },
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockTemplate);
    });

    it('should return null when no template is found', async () => {
        userPersonalTemplate.findOne.mockResolvedValue(null);

        const result = await findById(999);

        expect(userPersonalTemplate.findOne).toHaveBeenCalledWith({
            where: { id: 999 },
            raw: true,
            nest: true,
        });
        expect(result).toBeNull();
    });

    it('should throw an error if database query fails', async () => {
        userPersonalTemplate.findOne.mockRejectedValue(new Error('Database error'));

        await expect(findById(1)).rejects.toThrow('Database error');
    });
});
