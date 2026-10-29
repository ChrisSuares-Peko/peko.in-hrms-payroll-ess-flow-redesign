const { findESignDoc } = require('../../eSign');
const eSign = require('../../../entities/eSign');

// Mock dependencies
jest.mock('../../../entities/eSign');

describe('findESignDoc', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch all pending eSign documents with valid expiry dates and reminders enabled', async () => {
        const currentDate = new Date();
      
        // Mocked data returned by eSign.findAll
        const mockESignDocs = [
            {
                docket_title: 'Test Docket',
                reminder_interval: 7,
                reminder: true,
                status: 'PENDING',
                createdAt: new Date(),
                signers_info: 'Info about signers',
                doc_expiry_date: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week later
            },
        ];

        eSign.findAll.mockResolvedValue(mockESignDocs);

        const result = await findESignDoc();

       

        // Validate the returned result
        expect(result).toEqual({ status: true, data: mockESignDocs });
    });

    it('should handle errors and return a failure response', async () => {
        // Mocked error
        const error = new Error('Database error');
        eSign.findAll.mockRejectedValue(error);

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const result = await findESignDoc();

        // Ensure error is logged
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching eSign documents:', error);

        // Ensure the function returns the correct failure response
        expect(result).toEqual({ status: false, message: 'Something went wrong while fetching the document' });

        consoleSpy.mockRestore();
    });
});
