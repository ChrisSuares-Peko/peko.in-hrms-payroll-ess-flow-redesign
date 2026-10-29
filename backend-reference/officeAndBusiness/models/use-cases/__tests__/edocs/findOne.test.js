// Import necessary modules
const {findOne} = require('../../edocs');
const edocs = require('../../../entities/edocs');
// Mock dependencies
jest.mock('../../../entities/edocs',()=>({
    findOne: jest.fn(),
}));

describe('findOne', () => {
    // Clear all mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    // Test case for successful data retrieval
    it('should return the document when edocs.findOne resolves', async () => {
        const params = {
            documentName: 'Test Document'
        };

        // Mocked data to be returned by edocs.findOne
        const mockData = {
            id: 1,
            documentName: 'Test Document',
            category: 'Test Category'
        };

        // Mock the edocs.findOne function to resolve with mockData
        edocs.findOne.mockResolvedValue(mockData);

        // Call the findOne function with the mocked params
        const result = await findOne(params);

        // Assertions
        expect(edocs.findOne).toHaveBeenCalledWith({
            where: {
                documentName: 'Test Document'
            },
            raw: true
        });
        expect(result).toEqual(mockData);
    });

    // Test case for handling errors
    it('should handle errors during the findOne process', async () => {
        const params = {
            documentName: 'Test Document'
        };

        // Mock the edocs.findOne function to reject with an error
        edocs.findOne.mockRejectedValue(new Error('Database error'));

        // Call the findOne function with the mocked params
        const result = await findOne(params);

        // Assertions
        expect(edocs.findOne).toHaveBeenCalledWith({
            where: {
                documentName: 'Test Document'
            },
            raw: true
        });
        // Check if the function returns undefined due to the catch block
        expect(result).toBeUndefined();
    });
    it('should handle null documentName', async () => {
        edocs.findOne.mockResolvedValue(null);

        const result = await findOne({ documentName: null });

        expect(edocs.findOne).toHaveBeenCalledWith({
            where: { documentName: null },
            raw: true
        });
        expect(result).toBeNull();
    });

    it('should handle undefined documentName', async () => {
        edocs.findOne.mockResolvedValue(null);

        const result = await findOne({ documentName: undefined });

        expect(edocs.findOne).toHaveBeenCalledWith({
            where: { documentName: undefined },
            raw: true
        });
        expect(result).toBeNull();
    });
    // Test case to ensure the finally block is executed
  
});
