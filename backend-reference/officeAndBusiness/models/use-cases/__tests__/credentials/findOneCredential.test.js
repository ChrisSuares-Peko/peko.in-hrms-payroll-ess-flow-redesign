const { findOneCredential } = require('../../../use-cases/credential');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/credential', () => ({
    findOne: jest.fn(),
}));

describe('findOneCredential', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a credential when a matching record is found', async () => {
        const mockParams = { id: 123 };
        const mockAttributes = ['id', 'name'];
        const mockCredential = { id: 123, name: 'Test Credential' };

        credential.findOne.mockResolvedValue(mockCredential);

        const result = await findOneCredential(mockParams, mockAttributes);

        expect(credential.findOne).toHaveBeenCalledWith({
            where: {
                id: mockParams.id,
            },
            attributes: mockAttributes,
        });
        expect(result).toEqual(mockCredential);
    });

    it('should return null when no matching credential is found', async () => {
        const mockParams = { id: 456 };
        
        credential.findOne.mockResolvedValue(null);

        const result = await findOneCredential(mockParams);

        expect(credential.findOne).toHaveBeenCalledWith({
            where: {
                id: mockParams.id,
            },
            attributes: undefined,
        });
        expect(result).toBeNull();
    });

    it('should log an error if findOne fails', async () => {
        const mockParams = { id: 789 };
        const mockError = new Error('Database error');

        console.log = jest.fn();
        credential.findOne.mockRejectedValue(mockError);

        await findOneCredential(mockParams);

        expect(console.log).toHaveBeenCalledWith(mockError);
        expect(console.log).toHaveBeenCalledWith("CREDENTIAL FIND ONE ROUTE CALLED");
    });

    it('should log the message when function is executed', async () => {
        const mockParams = { id: 123 };
        const mockCredential = { id: 123, name: 'Test Credential' };

        console.log = jest.fn();
        credential.findOne.mockResolvedValue(mockCredential);

        await findOneCredential(mockParams);

        expect(console.log).toHaveBeenCalledWith("CREDENTIAL FIND ONE ROUTE CALLED");
    });
});