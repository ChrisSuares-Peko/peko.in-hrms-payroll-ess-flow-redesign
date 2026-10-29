const { findOneCredentialWithUsername } = require('../../credential'); 
const credential = require('../../../entities/credential'); 
const { Op } = require('sequelize');

// Mock the credential model
jest.mock('../../../entities/credential');

describe('findOneCredentialWithUsername function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully retrieve a credential with the specified username or email and role', async () => {
        const username = 'testUser';
        const mockCredential = { passwordProtection: 'REDACTED' };

        credential.findOne.mockResolvedValue(mockCredential);

        const result = await findOneCredentialWithUsername(username);

        expect(credential.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { username: username, role: "CORPORATE" },
                    { email: username, role: "CORPORATE" },
                    { username: username, role: "SYSTEM_USER" },
                    { email: username, role: "SYSTEM_USER" },
                    { email: username, role: "CORPORATE_SUB_USER" },
                    { username: username, role: "CORPORATE_SUB_USER" },
                ],
            },
            attributes: ['passwordProtection']
        });
        expect(result).toEqual(mockCredential);
    });

    it('should return null if no credential is found', async () => {
        const username = 'nonExistentUser';

        credential.findOne.mockResolvedValue(null);

        const result = await findOneCredentialWithUsername(username);

        expect(credential.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { username: username, role: "CORPORATE" },
                    { email: username, role: "CORPORATE" },
                    { username: username, role: "SYSTEM_USER" },
                    { email: username, role: "SYSTEM_USER" },
                    { email: username, role: "CORPORATE_SUB_USER" },
                    { username: username, role: "CORPORATE_SUB_USER" },
                ],
            },
            attributes: ['passwordProtection']
        });
        expect(result).toBeNull();
    });

    it('should handle errors and log them', async () => {
        const username = 'testUser';

        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        credential.findOne.mockRejectedValue(new Error('Database error'));

        const result = await findOneCredentialWithUsername(username);

        expect(credential.findOne).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    { username: username, role: "CORPORATE" },
                    { email: username, role: "CORPORATE" },
                    { username: username, role: "SYSTEM_USER" },
                    { email: username, role: "SYSTEM_USER" },
                    { email: username, role: "CORPORATE_SUB_USER" },
                    { username: username, role: "CORPORATE_SUB_USER" },
                ],
            },
            attributes: ['passwordProtection']
        });
        expect(consoleLogSpy).toHaveBeenCalledWith(new Error('Database error'));
        expect(result).toBeUndefined();
        consoleLogSpy.mockRestore();
    });

    it('should call the finally block and log the call', async () => {
        const username = 'testUser';

        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        credential.findOne.mockResolvedValue(null);

        await findOneCredentialWithUsername(username);

        expect(consoleLogSpy).toHaveBeenCalledWith("CREDENTIAL FIND ONE ROUTE CALLED");
        consoleLogSpy.mockRestore();
    });
});
