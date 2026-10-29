const { findAllCorporateDocuments } = require('../../corporateDocuments');
const corporateDocuments = require('../../../entities/corporateDocuments');
const { Op } = require('sequelize');

jest.mock('../../../entities/corporateDocuments');

describe('findAllCorporateDocuments', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all corporate documents for given params', async () => {
        const params = {
            corporateUserId: 1,
            documentNames: ['Trade License', 'Passport'],
        };
        const mockResult = [
            { id: 1, documentName: 'Trade License', corporateUserId: 1 },
            { id: 2, documentName: 'Passport', corporateUserId: 1 },
        ];
        corporateDocuments.findAll.mockResolvedValue(mockResult);

        const result = await findAllCorporateDocuments(params);

        expect(corporateDocuments.findAll).toHaveBeenCalledWith({
            where: {
                corporateUserId: 1,
                documentName: { [Op.in]: ['Trade License', 'Passport'] },
            },
            attributes: ['id', 'documentName', 'document', 'documentType', 'corporateUserId'],
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockResult);
    });

    it('should return empty array when no documents found', async () => {
        corporateDocuments.findAll.mockResolvedValue([]);

        const result = await findAllCorporateDocuments({
            corporateUserId: 999,
            documentNames: ['None'],
        });
        expect(result).toEqual([]);
    });
});
