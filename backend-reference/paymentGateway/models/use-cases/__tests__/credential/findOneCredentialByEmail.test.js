const { findOneCredentialByEmail } = require('../../../use-cases/credential'); // Adjust path
const credential = require('../../../entities/credential'); // Adjust path

jest.mock('../../../entities/credential', () => ({
    findOne: jest.fn(),
}));

describe('findOneCredentialByEmail', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the credential when found', async () => {
        const mockParams = { email: 'test@example.com' };
        const mockCredential = { id: 1, email: 'test@example.com', name: 'Test User' }; // Example data

        credential.findOne.mockResolvedValue(mockCredential);

        const result = await findOneCredentialByEmail(mockParams);

        expect(credential.findOne).toHaveBeenCalledWith({
            where: { email: mockParams.email },
            attributes: undefined, // No attributes specified
        });
        expect(result).toEqual(mockCredential);
    });

    it('should return the credential with specified attributes', async () => {
        const mockParams = { email: 'test@example.com' };
        const mockAttributes = ['id', 'name'];
        const mockCredential = { id: 1, email: 'test@example.com', name: 'Test User' }; // Example data

        credential.findOne.mockResolvedValue(mockCredential);

        const result = await findOneCredentialByEmail(mockParams, mockAttributes);

        expect(credential.findOne).toHaveBeenCalledWith({
            where: { email: mockParams.email },
            attributes: mockAttributes,
        });
        expect(result).toEqual(mockCredential);
    });

    it('should return null when credential is not found', async () => {
        const mockParams = { email: 'nonexistent@example.com' };

        credential.findOne.mockResolvedValue(null);

        const result = await findOneCredentialByEmail(mockParams);

        expect(credential.findOne).toHaveBeenCalledWith({
            where: { email: mockParams.email },
            attributes: undefined,
        });
        expect(result).toBeNull();
    });

    it('should handle errors during database operations', async () => {
        const mockParams = { email: 'test@example.com' };
        const mockError = new Error('Database error');

        credential.findOne.mockRejectedValue(mockError);
        const consoleLogSpy = jest.spyOn(console, 'log');

        const result = await findOneCredentialByEmail(mockParams);

        expect(credential.findOne).toHaveBeenCalledWith({
            where: { email: mockParams.email },
            attributes: undefined,
        });
        expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
        expect(consoleLogSpy).toHaveBeenCalledWith("CREDENTIAL FIND ONE ROUTE CALLED");
        expect(result).toBeUndefined(); // Or handle the error as you prefer (e.g., re-throw)

        consoleLogSpy.mockRestore();
    });

    it('should handle missing email parameter', async () => {
        const mockParams = {}; // Missing email

        await findOneCredentialByEmail(mockParams);

        expect(credential.findOne).toHaveBeenCalledWith({
            where: { email: undefined }, // Or perhaps throw an error if email is required
            attributes: undefined,
        });
        // You might want to add an expectation here depending on how you handle missing email.
        // For example, if you throw an error, you'd use:
        // await expect(findOneCredentialByEmail(mockParams)).rejects.toThrow();
    });
});