const { documentsAndCountExport } = require('../../eSign');
const eSign = require('../../../entities/eSign');
const credential = require('../../../entities/credential');
const { Op } = require('sequelize');
const { formattedDateTime } = require('../../../../utils/formatter');
const { handleSortFields } = require('../../../../utils/sortHandle');

jest.mock('../../../entities/eSign', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/credential');
jest.mock('../../../../utils/formatter', () => ({
    formattedDateTime: jest.fn(),
}));
jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));

describe('documentsAndCountExport Function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find and return formatted eSign documents based on the search criteria', async () => {
        const params = {
            searchText: 'Test',
            sort: 'DESC',
            sortField: 'createdAt',
            corporateId: 1,
        };

        const mockOrder = [['createdAt', 'DESC']];
        handleSortFields.mockReturnValue(mockOrder);

        const mockESignData = {
            count: 2,
            rows: [
                {
                    createdAt: '2024-08-20T12:00:00Z',
                    docket_title: 'Test Docket',
                    status: 'PENDING',
                    credential: {
                        name: 'Test Corp',
                        username: 'corp123',
                    },
                },
                {
                    createdAt: '2024-08-21T12:00:00Z',
                    docket_title: 'Another Docket',
                    status: 'COMPLETED',
                    credential: {
                        name: 'Another Corp',
                        username: 'corp456',
                    },
                },
            ],
        };

        formattedDateTime.mockImplementation((date) => new Date(date).toLocaleString());

        eSign.findAndCountAll.mockResolvedValue(mockESignData);

        const result = await documentsAndCountExport(params);

        expect(handleSortFields).toHaveBeenCalledWith(params.sortField, params.sort);
        expect(eSign.findAndCountAll).toHaveBeenCalledWith({
            include: [{
                model: credential,
                attributes: ['name', 'username'],
            }],
            where: {
                [Op.or]: [
                    { docket_title: { [Op.like]: `%${params.searchText}%` } },
                    { status: { [Op.like]: `%${params.searchText}%` } },
                    { '$credential.name$': { [Op.like]: `%${params.searchText}%` } },
                    { '$credential.username$': { [Op.like]: `%${params.searchText}%` } },
                ],
                credentialId: params.corporateId,
            },
            order: mockOrder,
            raw: true,
            nest: true,
        });

        expect(formattedDateTime).toHaveBeenCalledTimes(2);

        expect(result).toEqual([
            {
                Date: new Date('2024-08-20T12:00:00Z').toLocaleString(),
                "Corporate Name": 'Test Corp',
                "Corporate ID": 'corp123',
                "Document Name": 'Test Docket',
                Status: 'PENDING',
            },
            {
                Date: new Date('2024-08-21T12:00:00Z').toLocaleString(),
                "Corporate Name": 'Another Corp',
                "Corporate ID": 'corp456',
                "Document Name": 'Another Docket',
                Status: 'COMPLETED',
            },
        ]);
    });

    it('should handle errors correctly', async () => {
        const params = {
            searchText: 'Test',
            sort: 'DESC',
            sortField: 'createdAt',
            corporateId: 1,
        };

        console.log = jest.fn();
        eSign.findAndCountAll.mockRejectedValue(new Error('Database error'));

        await expect(documentsAndCountExport(params)).rejects.toEqual({ message: 'Something went wrong' });

        expect(eSign.findAndCountAll).toHaveBeenCalled();
    });
});
