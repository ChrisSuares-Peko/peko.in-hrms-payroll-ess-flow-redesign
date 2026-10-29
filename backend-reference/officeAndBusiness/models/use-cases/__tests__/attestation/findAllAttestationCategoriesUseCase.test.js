const { Op } = require('sequelize');
const attestationCategory = require('../../../entities/attestationCategory');
const { findAllAttestationCategoriesUseCase } = require('../../../use-cases/attestation');

jest.mock('../../../entities/attestationCategory', () => ({
    findAndCountAll: jest.fn(),
}));

describe('findAllAttestationCategoriesUseCase', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return attestation categories based on the search criteria', async () => {
        const params = {
            limit: 10,
            offset: 0,
            searchText: 'test',
            sort: 'ASC',
            sortField: 'label',
            from: '2024-01-01',
            to: '2024-02-01',
        };

        const mockResponse = {
            count: 2,
            rows: [
                {
                    id: '1',
                    countryCode: 'US',
                    label: 'Test Label',
                    value: 'Test Value',
                    price: '100',
                    country: 'USA',
                    createdAt: new Date('2024-01-10'),
                },
                {
                    id: '2',
                    countryCode: 'AE',
                    label: 'Another Label',
                    value: 'Another Value',
                    price: '200',
                    country: 'UAE',
                    createdAt: new Date('2024-01-15'),
                },
            ],
        };

        attestationCategory.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await findAllAttestationCategoriesUseCase(params);

        expect(result).toEqual(mockResponse);
        expect(attestationCategory.findAndCountAll).toHaveBeenCalledWith({
            attributes: ['id', 'countryCode', 'label', 'value', 'price', 'country', 'createdAt'],
            where: {
                [Op.or]: [
                    { id: { [Op.like]: '%test%' } },
                    { label: { [Op.like]: '%test%' } },
                    { value: { [Op.like]: '%test%' } },
                    { country: { [Op.like]: '%test%' } },
                    { price: { [Op.like]: '%test%' } },
                ],
                createdAt: {
                    [Op.between]: [params.from, new Date('2024-02-01T18:30:00.000Z')],
                },
            },
            order: [['label', 'ASC']],
            limit: 10,
            offset: 0,
        });
    });

    it('should return attestation categories without date filtering if from and to are not provided', async () => {
        const params = {
            limit: 5,
            offset: 0,
            searchText: 'UAE',
            sort: 'DESC',
            sortField: 'country',
        };

        const mockResponse = {
            count: 1,
            rows: [
                {
                    id: '3',
                    countryCode: 'AE',
                    label: 'Dubai Label',
                    value: 'Dubai Value',
                    price: '150',
                    country: 'UAE',
                    createdAt: new Date('2024-01-20'),
                },
            ],
        };

        attestationCategory.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await findAllAttestationCategoriesUseCase(params);

        expect(result).toEqual(mockResponse);
        expect(attestationCategory.findAndCountAll).toHaveBeenCalledWith({
            attributes: ['id', 'countryCode', 'label', 'value', 'price', 'country', 'createdAt'],
            where: {
                [Op.or]: [
                    { id: { [Op.like]: '%UAE%' } },
                    { label: { [Op.like]: '%UAE%' } },
                    { value: { [Op.like]: '%UAE%' } },
                    { country: { [Op.like]: '%UAE%' } },
                    { price: { [Op.like]: '%UAE%' } },
                ],
            },
            order: [['country', 'DESC']],
            limit: 5,
            offset: 0,
        });
    });

    it('should throw an error if findAndCountAll fails', async () => {
        const params = {
            limit: 5,
            offset: 0,
            searchText: 'Error',
            sort: 'ASC',
            sortField: 'label',
        };

        const expectedError = new Error('Database error');
        attestationCategory.findAndCountAll.mockRejectedValue(expectedError);

        await expect(findAllAttestationCategoriesUseCase(params)).rejects.toThrow('Database error');
        expect(attestationCategory.findAndCountAll).toHaveBeenCalledWith({
            attributes: ['id', 'countryCode', 'label', 'value', 'price', 'country', 'createdAt'],
            where: {
                [Op.or]: [
                    { id: { [Op.like]: '%Error%' } },
                    { label: { [Op.like]: '%Error%' } },
                    { value: { [Op.like]: '%Error%' } },
                    { country: { [Op.like]: '%Error%' } },
                    { price: { [Op.like]: '%Error%' } },
                ],
            },
            order: [['label', 'ASC']],
            limit: 5,
            offset: 0,
        });
    });
});
