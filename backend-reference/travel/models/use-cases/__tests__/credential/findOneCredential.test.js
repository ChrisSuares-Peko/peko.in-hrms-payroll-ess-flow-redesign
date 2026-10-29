const { findOneCredential } = require('../../../use-cases/credential');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/credential', () => ({
    findOne: jest.fn(),
}));

describe('findOneCredential', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a credential if found by ID', async () => {
        const mockParams = { id: 1 };
        const mockAttributes = ['id', 'email'];
        const mockCredential = { id: 1, email: 'test@example.com' };

        credential.findOne.mockResolvedValue(mockCredential);

        const result = await findOneCredential(mockParams, mockAttributes);

        expect(credential.findOne).toHaveBeenCalledWith({
            where: { id: mockParams.id },
            attributes: mockAttributes,
        });
        expect(result).toEqual(mockCredential);
    });

    it('should return null if no credential is found', async () => {
        const mockParams = { id: 999 };
        credential.findOne.mockResolvedValue(null);

        const result = await findOneCredential(mockParams);

        expect(result).toBeNull();
    });

  
});
