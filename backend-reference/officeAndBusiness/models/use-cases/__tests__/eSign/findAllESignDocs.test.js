const { findAllESignDocs } = require('../../eSign'); 
const eSign = require('../../../entities/eSign');
const credential = require('../../../entities/credential');
const SubCorporateUser = require('../../../entities/subCorporateUsers');
const { Op } = require('sequelize');

jest.mock('../../../entities/eSign', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/credential');
jest.mock('../../../entities/subCorporateUsers');

describe('findAllESignDocs Function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find and return all eSign documents based on the search criteria', async () => {
        const params = {
            page: 1,
            pageSize: 10,
            searchText: 'Test',
            order: 'DESC',
            column: 0,
            subCorporateUserId: 2,
        };
        const userId = 1;
        const mockResult = {
            count: 1,
            rows: [
                {
                    id: 1,
                    docket_title: 'Test Docket',
                    status: 'PENDING',
                    credential: {
                        id: 1,
                        name: 'Test User'
                    },
                    SubCorporateUser: {
                        id: 2,
                        name: 'Sub Corporate User'
                    }
                }
            ]
        };

        eSign.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findAllESignDocs(params, userId);

        const searchPattern = `%${params.searchText}%`;

        expect(eSign.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: credential,
                    attributes: ['id', 'name']
                },
                {
                    model: SubCorporateUser,
                    attributes: ['id', 'name'],
                    required: false
                }
            ],
            where: {
                [Op.or]: [
                    { docket_title: { [Op.like]: searchPattern } },
                    { status: { [Op.like]: searchPattern } },
                    { '$credential.name$': { [Op.like]: searchPattern } }
                ],
                credentialId: userId,
                subCorporateUserId: params.subCorporateUserId
            },
            order: [
                ['createdAt', params.order]
            ],
            limit: params.pageSize,
            offset: (params.page - 1) * params.pageSize,
            raw: true,
            nest: true,
        });

        expect(result).toEqual(mockResult);
    });

    it('should return false if an error occurs', async () => {
        const params = {
            page: 1,
            pageSize: 10,
            searchText: 'Test',
            order: 'DESC',
            column: 0,
            subCorporateUserId: 2,
        };
        const userId = 1;

        console.log = jest.fn();
        eSign.findAndCountAll.mockRejectedValue(new Error('Database Error'));

        const result = await findAllESignDocs(params, userId);

        expect(eSign.findAndCountAll).toHaveBeenCalled();
        expect(result).toBe(false);
    });
});
