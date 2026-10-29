const { documentsAndCountExport } = require('../../../use-cases/edocs');
const edocs = require('../../../entities/edocs');
const { handleSortFields } = require('../../../../utils/sortHandle');
const {Op}=require('sequelize')
jest.mock('../../../entities/edocs',()=>({
    findAndCountAll:jest.fn()
}));
jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn().mockReturnValue([['createdAt', 'ASC']])
}));
jest.mock('../../../../utils/formatter', () => ({
    formattedDateTime: jest.fn().mockReturnValue('formatted date')
}));

describe('documentsAndCountExport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    afterAll(async () => {
        jest.clearAllMocks();
    });
    describe('documentsAndCountExport', () => {
        it('should call handleSortFields and apply sorting', async () => {
            handleSortFields.mockReturnValue([['createdAt', 'DESC']]);
    
            edocs.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    
            const params = { searchText: '', sort: 'DESC', sortField: 'createdAt' };
            await documentsAndCountExport(params);
    
            expect(handleSortFields).toHaveBeenCalledWith('createdAt', 'DESC');
            expect(edocs.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    order: [['createdAt', 'DESC']]
                })
            );
        });
    
        it('should apply search conditions correctly', async () => {
            edocs.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
        
            const params = { searchText: 'test', sort: 'DESC', sortField: 'createdAt' };
            await documentsAndCountExport(params);
        
            expect(edocs.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        [Op.or]: [
                            { id: { [Op.like]: '%test%' } },
                            { documentName: { [Op.like]: '%test%' } },
                            { description: { [Op.like]: '%test%' } },
                            { '$category.categoryName$': { [Op.like]: '%test%' } },
                        ],
                    },
                })
            );
        });
        
    
        it('should correctly format the data for export', async () => {
            const mockData = {
                count: 1,
                rows: [
                    {
                        createdAt: new Date(),
                        documentName: 'Document 1',
                        category: { categoryName: 'Category 1' },
                        description: 'Description 1',
                        documentUrl: 'http://example.com/document1.pdf',
                        status: 1
                    }
                ]
            };
            edocs.findAndCountAll.mockResolvedValue(mockData);
    
            const result = await documentsAndCountExport({ searchText: '', sort: 'DESC', sortField: 'createdAt' });
    
            expect(result).toEqual([
                {
                    Date: expect.any(String), // Mock the formatted date
                    "Document Name": 'Document 1',
                    Category: 'Category 1',
                    Description: 'Description 1',
                    "Document Url": 'http://example.com/document1.pdf',
                    Status: 'Active'
                }
            ]);
        });
    
        it('should handle missing or undefined data fields', async () => {
            const mockData = {
                count: 1,
                rows: [
                    {
                        createdAt: null,
                        documentName: null,
                        category: { categoryName: null },
                        description: null,
                        documentUrl: null,
                        status: 0
                    }
                ]
            };
            edocs.findAndCountAll.mockResolvedValue(mockData);
    
            const result = await documentsAndCountExport({ searchText: '', sort: 'DESC', sortField: 'createdAt' });
    
            expect(result).toEqual([
                {
                    Date: 'Not Available',
                    "Document Name": 'Not Available',
                    Category: 'Not Available',
                    Description: 'Not Available',
                    "Document Url": 'Not Available',
                    Status: 'In Active'
                }
            ]);
        });
    
        it('should handle errors and throw a custom error message', async () => {
            edocs.findAndCountAll.mockRejectedValue(new Error('Database error'));
    
            const params = { searchText: '', sort: 'DESC', sortField: 'createdAt' };
    
            await expect(documentsAndCountExport(params)).rejects.toEqual({ message: 'Something went wrong' });
        });
    });
});