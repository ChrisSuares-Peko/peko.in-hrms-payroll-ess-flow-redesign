const { findDocToUpdate } = require('../../eSign');
const eSign = require('../../../entities/eSign');

jest.mock('../../../entities/eSign', () => ({
    findOne: jest.fn(),
}));

describe('findDocToUpdate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the eSign document if found', async () => {
        const mockParams = { document_id: '123', docket_id: '456' };
        const mockDoc = { document_id: '123', docket_id: '456', status: 'PENDING' };

        eSign.findOne.mockResolvedValue(mockDoc);

        const result = await findDocToUpdate(mockParams);

        expect(eSign.findOne).toHaveBeenCalledWith({
            where: { document_id: mockParams.document_id, docket_id: mockParams.docket_id },
            nest: true
        });

        expect(result).toEqual({ status: true, data: mockDoc });
    });

    it('should return a status of false if no document is found', async () => {
        const mockParams = { document_id: '123', docket_id: '456' };

        eSign.findOne.mockResolvedValue(null);

        const result = await findDocToUpdate(mockParams);

        expect(eSign.findOne).toHaveBeenCalledWith({
            where: { document_id: mockParams.document_id, docket_id: mockParams.docket_id },
            nest: true
        });

        expect(result).toEqual({ status: false, message: 'eSign document not found' });
    });

    it('should handle errors and return an appropriate error message', async () => {
        const mockParams = { document_id: '123', docket_id: '456' };
        const mockError = new Error('Database error');

        eSign.findOne.mockRejectedValue(mockError);

        const result = await findDocToUpdate(mockParams);

        expect(eSign.findOne).toHaveBeenCalledWith({
            where: { document_id: mockParams.document_id, docket_id: mockParams.docket_id },
            nest: true
        });

        expect(result).toEqual({
            status: false,
            message: 'Something went wrong while fetching the document'
        });
    });
});
