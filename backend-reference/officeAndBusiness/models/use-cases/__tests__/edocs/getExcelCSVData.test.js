// Import necessary modules
const { getExcelCSVData } = require('../../edocs'); 
const edocs = require('../../../entities/edocs'); 

// Mock the edocs module
jest.mock('../../../entities/edocs', () => ({
    findAndCountAll: jest.fn(),
}));

describe('getExcelCSVData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test for successful data retrieval and formatting
    it('should return formatted data', async () => {
        // Arrange
        const mockData = {
            rows: [
                {
                    id: 1,
                    documentType: 'Type1',
                    documentName: 'Doc1',
                    documentUrl: 'http://example.com/doc1',
                    status: true,
                    createdAt: '2023-01-01'
                },
                {
                    id: 2,
                    documentType: null,
                    documentName: 'Doc2',
                    documentUrl: null,
                    status: null,
                    createdAt: '2023-01-02'
                }
            ]
        };

        edocs.findAndCountAll.mockResolvedValue(mockData);

        // Act
        const result = await getExcelCSVData();

        // Assert
        expect(edocs.findAndCountAll).toHaveBeenCalledWith({
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true
        });

        expect(result).toEqual([
            {
                'ID': 1,
                'Document Type': 'Type1',
                'Document Name': 'Doc1',
                'Document URL': 'http://example.com/doc1',
                'Status': 'Active'
            },
            {
                'ID': 2,
                'Document Type': 'Not Available',
                'Document Name': 'Doc2',
                'Document URL': 'Not Available',
                'Status': 'Not Available'
            }
        ]);
    });

    // Test for empty data
    it('should return an empty array if no data is found', async () => {
        // Arrange
        edocs.findAndCountAll.mockResolvedValue({ rows: [] });

        // Act
        const result = await getExcelCSVData();

        // Assert
        expect(edocs.findAndCountAll).toHaveBeenCalledWith({
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true
        });

        expect(result).toEqual([]);
    });

    // Test for error handling
    it('should propagate an error if the database query fails', async () => {
        // Arrange
        const error = new Error('Database error');
        edocs.findAndCountAll.mockRejectedValue(error);

        // Act & Assert
        await expect(getExcelCSVData()).rejects.toThrow('Database error');
    });
    
});
