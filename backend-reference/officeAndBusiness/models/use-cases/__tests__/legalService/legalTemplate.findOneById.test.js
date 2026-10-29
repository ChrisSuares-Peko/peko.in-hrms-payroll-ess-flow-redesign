const { findOneById } = require('../../legalTemplate');
const legalTemplate = require('../../../entities/legalTemplate');

jest.mock('../../../entities/legalTemplate');
jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));
jest.mock('../../../../utils/commonUploadFile');

describe('legalTemplate - findOneById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a template when found by ID', async () => {
        const mockTemplate = {
            id: 1,
            title: 'NDA Template',
            category: 'Legal',
            description: 'Non-disclosure agreement',
            timeEstimate: '30 mins',
            isActive: true,
            documentUrl: 'https://s3.example.com/nda.pdf',
        };

        legalTemplate.findOne.mockResolvedValue(mockTemplate);

        const result = await findOneById(1);

        expect(legalTemplate.findOne).toHaveBeenCalledWith({ where: { id: 1 }, raw: true });
        expect(result).toEqual(mockTemplate);
    });

    it('should return null when no template is found', async () => {
        legalTemplate.findOne.mockResolvedValue(null);

        const result = await findOneById(999);

        expect(legalTemplate.findOne).toHaveBeenCalledWith({ where: { id: 999 }, raw: true });
        expect(result).toBeNull();
    });

    it('should throw an error if database query fails', async () => {
        legalTemplate.findOne.mockRejectedValue(new Error('Database error'));

        await expect(findOneById(1)).rejects.toThrow('Database error');
    });
});
