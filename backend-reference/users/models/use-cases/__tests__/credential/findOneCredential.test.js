const { findOneCredential } = require('../../credential'); 
const credential = require('../../../entities/credential'); 

jest.mock('../../../entities/credential');

describe('findOneCredential function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully retrieve a credential with specified attributes', async () => {
        const params = { id: 1 };
        const attributes = ['id', 'username'];
        const mockCredential = { id: 1, username: 'testUser', password: 'testPass' };

        credential.findOne.mockResolvedValue(mockCredential);

        const result = await findOneCredential(params, attributes);

        expect(credential.findOne).toHaveBeenCalledWith({
            where: { id: params.id },
            attributes
        });
        expect(result).toEqual(mockCredential);
    });

    it('should return null if no credential is found', async () => {
        const params = { id: 2 };
        const attributes = ['id', 'username'];

        credential.findOne.mockResolvedValue(null);

        const result = await findOneCredential(params, attributes);

        expect(credential.findOne).toHaveBeenCalledWith({
            where: { id: params.id },
            attributes
        });
        expect(result).toBeNull();
    });

    it('should handle errors and log them', async () => {
        const params = { id: 3 };
        const attributes = ['id', 'username'];

        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        credential.findOne.mockRejectedValue(new Error('Database error'));

        const result = await findOneCredential(params, attributes);

        expect(credential.findOne).toHaveBeenCalledWith({
            where: { id: params.id },
            attributes
        });
        expect(consoleLogSpy).toHaveBeenCalledWith(new Error('Database error'));
        expect(result).toBeUndefined();
        consoleLogSpy.mockRestore();
    });

    it('should call the finally block and log the call', async () => {
        const params = { id: 4 };
        const attributes = ['id', 'username'];

        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        credential.findOne.mockResolvedValue(null);

        await findOneCredential(params, attributes);

        expect(consoleLogSpy).toHaveBeenCalledWith("CREDENTIAL FIND ONE ROUTE CALLED");
        consoleLogSpy.mockRestore();
    });
});
