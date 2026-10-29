const { create } = require('../../userPersonalTemplate');
const userPersonalTemplate = require('../../../entities/userPersonalTemplate');

jest.mock('../../../entities/userPersonalTemplate');

describe('userPersonalTemplate - create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a personal template and return the created data', async () => {
        const params = {
            corporateUserId: 10,
            subCorporateUserId: null,
            title: 'My Custom NDA',
            iconKey: 'nda',
            category: 'Legal',
            timeEstimate: '20 mins',
            html: '<p>This agreement is between {{Party Name}} and...</p>',
        };

        const mockCreated = {
            id: 1,
            ...params,
            createdAt: '2024-01-01T10:00:00.000Z',
            updatedAt: '2024-01-01T10:00:00.000Z',
        };

        userPersonalTemplate.create.mockResolvedValue(mockCreated);

        const result = await create(params);

        expect(userPersonalTemplate.create).toHaveBeenCalledWith(params);
        expect(result).toEqual(mockCreated);
    });

    it('should throw an error if creation fails', async () => {
        userPersonalTemplate.create.mockRejectedValue(new Error('Database error'));

        await expect(create({ corporateUserId: 10, title: 'My NDA', html: '<p>Content</p>' })).rejects.toThrow('Database error');
    });
});
