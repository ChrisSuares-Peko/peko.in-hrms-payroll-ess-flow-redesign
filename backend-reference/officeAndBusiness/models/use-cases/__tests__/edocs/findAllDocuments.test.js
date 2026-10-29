const { findAllDocuments } = require('../../edocs');
const edocs = require('../../../entities/edocs');
const { Op } = require('sequelize');


// Mock dependencies
jest.mock('../../../entities/edocs');

describe('findAllDocuments', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return documents and total count with default query options', async () => {
        const mockDocuments = [
            { id: 1, documentName: 'Test Doc', category: { id: 1, categoryname: 'Test Category' } },
        ];
        const mockTotalCount = 1;

        edocs.findAll.mockResolvedValue(mockDocuments);
        edocs.count.mockResolvedValue(mockTotalCount);

        const result = await findAllDocuments(null, null, null, 10, 0);

        expect(edocs.findAll).toHaveBeenCalledWith({
            include: {
                model: expect.anything(),
                attributes: ['id', 'categoryname'],
            },
            where: { status: true },
            attributes: undefined,
            limit: 10,
            offset: 0,
            order: [],
        });

        expect(edocs.count).toHaveBeenCalledWith({
            include: {
                model: expect.anything(),
                attributes: ['id', 'categoryname'],
            },
            where: { status: true },
        });

        expect(result).toEqual({
            documents: mockDocuments,
            totalCount: mockTotalCount,
        });
    });

    it('should filter documents by categoryName', async () => {
        const categoryName = 'Test Category';
        const mockDocuments = [
            { id: 1, documentName: 'Test Doc', category: { id: 1, categoryname: 'Test Category' } },
        ];

        edocs.findAll.mockResolvedValue(mockDocuments);
        edocs.count.mockResolvedValue(1);

        const result = await findAllDocuments(categoryName, null, null, 10, 0);

        expect(edocs.findAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    status: true,
                    '$category.categoryname$': categoryName,
                },
            })
        );

        expect(result.documents).toEqual(mockDocuments);
    });

    it('should filter documents by searchText', async () => {
        const searchText = 'Doc';
        const mockDocuments = [
            { id: 1, documentName: 'Test Doc', category: { id: 1, categoryname: 'Test Category' } },
        ];

        edocs.findAll.mockResolvedValue(mockDocuments);
        edocs.count.mockResolvedValue(1);

        const result = await findAllDocuments(null, searchText, null, 10, 0);

        expect(edocs.findAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    status: true,
                    documentName: { [Op.like]: `%${searchText}%` },
                },
            })
        );

        expect(result.documents).toEqual(mockDocuments);
    });

    it('should sort documents by name', async () => {
        const sort = 'name';
        const mockDocuments = [
            { id: 1, documentName: 'A Doc', category: { id: 1, categoryname: 'Test Category' } },
        ];

        edocs.findAll.mockResolvedValue(mockDocuments);
        edocs.count.mockResolvedValue(1);

        const result = await findAllDocuments(null, null, sort, 10, 0);

        expect(edocs.findAll).toHaveBeenCalledWith(
            expect.objectContaining({
                order: [['documentName', 'ASC']],
            })
        );

        expect(result.documents).toEqual(mockDocuments);
    });

    it('should sort documents by date', async () => {
        const sort = 'date';
        const mockDocuments = [
            { id: 1, documentName: 'Test Doc', createdAt: '2023-11-30', category: { id: 1, categoryname: 'Test Category' } },
        ];

        edocs.findAll.mockResolvedValue(mockDocuments);
        edocs.count.mockResolvedValue(1);

        const result = await findAllDocuments(null, null, sort, 10, 0);

        expect(edocs.findAll).toHaveBeenCalledWith(
            expect.objectContaining({
                order: [['createdAt', 'DESC']],
            })
        );

        expect(result.documents).toEqual(mockDocuments);
    });

    it('should handle errors gracefully', async () => {
        const error = new Error('Database error');
        edocs.findAll.mockRejectedValue(error);

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        const result = await findAllDocuments();

        expect(consoleSpy).toHaveBeenCalledWith(error);
        expect(result).toBeUndefined();

        consoleSpy.mockRestore();
    });
});

