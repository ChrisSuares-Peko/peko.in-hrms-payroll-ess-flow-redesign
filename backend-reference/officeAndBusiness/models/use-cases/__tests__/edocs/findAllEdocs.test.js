const { findAllEdocs } = require('../../edocs'); // Adjust the path as necessary
const edocs = require('../../../entities/edocs'); // Adjust the path as necessary

jest.mock('../../../entities/edocs'); // Adjust the path as necessary

describe('findAllEdocs', () => {
    let originalLog;

    beforeAll(() => {
        originalLog = console.log;
        console.log = jest.fn(); // Mock console.log
    });

    afterAll(() => {
        console.log = originalLog; // Restore original console.log
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should handle the case where queryOptions is null', async () => {
        // Temporarily override the findAll method to return null
        edocs.findAll.mockImplementation(() => null);

        const result = await findAllEdocs();

        // Since findAll was called with null
        expect(edocs.findAll).toHaveBeenCalled();
        expect(result).toBeNull();
    });
    
    it('should return documents when findAll is successful', async () => {
        // Arrange
        const mockDocuments = [
            { id: 1, documentName: 'Doc1', categoryId: 2 },
            { id: 2, documentName: 'Doc2', categoryId: 3 }
        ];
        edocs.findAll.mockResolvedValue(mockDocuments);

        // Act
        const result = await findAllEdocs();

        // Assert
        expect(result).toEqual(mockDocuments);
        expect(edocs.findAll).toHaveBeenCalledWith({
            attributes: ['id', 'documentName', 'categoryId'],
            where: { status: true }
        });
        expect(console.log).toHaveBeenCalledWith("DOCUMENT FIND ALL ROUTE CALLED");
    });

    it('should handle errors', async () => {
        // Arrange
        const error = new Error('Database error');
        edocs.findAll.mockRejectedValue(error);

        // Act
        const result = await findAllEdocs();

        // Assert
        expect(result).toBeUndefined(); // Since there's no return in the catch block
        expect(console.log).toHaveBeenCalledWith(error);
        expect(console.log).toHaveBeenCalledWith("DOCUMENT FIND ALL ROUTE CALLED");
    });
});
