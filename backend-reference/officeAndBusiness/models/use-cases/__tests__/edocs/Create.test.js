const edocs = require('../../../entities/edocs');
const { uploadDocument } = require('../../../../utils/s3');
const { create } = require('../../edocs');

// Mock dependencies
jest.mock('../../../entities/edocs');
jest.mock('../../../../utils/s3', () => ({
    uploadDocument: jest.fn(),
}))
describe('create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    

    it('should create an entry in edocs without uploading a document when no documentBase is provided', async () => {
        const mockCreatedData = { id: 2 };
        edocs.create.mockResolvedValue(mockCreatedData);

        const params = {
            name: 'Test Document',
        };

        const result = await create(params);

        // uploadDocument should not be called
        expect(uploadDocument).not.toHaveBeenCalled();

        // Assertions for edocs.create
        expect(edocs.create).toHaveBeenCalledWith({
            name: 'Test Document',
        });

        expect(result).toEqual(mockCreatedData);
    });

    it('should handle errors and throw a custom error message', async () => {
        edocs.create.mockRejectedValue(new Error('Database error'));

        const params = { name: 'Faulty Document' };

        await expect(create(params)).rejects.toThrow('Database error');
    });
});
