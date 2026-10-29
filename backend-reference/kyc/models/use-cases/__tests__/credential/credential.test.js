const {
    createCredential,
    findOneCredential,
    findAllCredential,
    updateCredential,
    deleteCredential,
    changePassword,
    fetchAllCorporate
} = require('../../credential');
const credential = require('../../../entities/credential');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('createCredential', () => {
    it('should create a credential', async () => {
        const mockResult = { id: 1, username: 'testuser' };
        credential.create.mockResolvedValue(mockResult);

        const result = await createCredential({ username: 'testuser', password: 'REDACTED' });
        expect(result).toEqual(mockResult);
    });

    it('should return undefined on error', async () => {
        credential.create.mockRejectedValue(new Error('DB Error'));

        const result = await createCredential({ username: 'testuser' });
        expect(result).toBeUndefined();
    });
});

describe('findOneCredential', () => {
    it('should find one credential by id', async () => {
        const mockResult = { id: 1, username: 'testuser' };
        credential.findOne.mockResolvedValue(mockResult);

        const result = await findOneCredential({ id: 1 });
        expect(result).toEqual(mockResult);
        expect(credential.findOne).toHaveBeenCalledWith({
            where: { id: 1 },
            attributes: undefined
        });
    });

    it('should pass attributes when provided', async () => {
        credential.findOne.mockResolvedValue({ id: 1 });

        await findOneCredential({ id: 1 }, ['id', 'username']);
        expect(credential.findOne).toHaveBeenCalledWith({
            where: { id: 1 },
            attributes: ['id', 'username']
        });
    });
});

describe('findAllCredential', () => {
    it('should find all credentials by id', async () => {
        const mockResult = [{ id: 1 }];
        credential.findAll.mockResolvedValue(mockResult);

        const result = await findAllCredential({ id: 1 });
        expect(result).toEqual(mockResult);
    });
});

describe('updateCredential', () => {
    it('should update a credential', async () => {
        credential.update.mockResolvedValue([1]);

        const result = await updateCredential({ id: 1 });
        expect(result).toEqual([1]);
    });
});

describe('deleteCredential', () => {
    it('should delete a credential', async () => {
        credential.destroy.mockResolvedValue(1);

        const result = await deleteCredential({ id: 1 });
        expect(result).toBe(1);
    });
});

describe('changePassword', () => {
    it('should change password successfully', async () => {
        const mockUser = {
            validatePassword: jest.fn().mockReturnValue(true)
        };
        credential.findOne.mockResolvedValue(mockUser);
        // Re-assign hashPassword as the entity source overwrites the mock
        credential.hashPassword = jest.fn().mockReturnValue('newHashedPassword');
        credential.update.mockResolvedValue([1]);

        const callback = jest.fn();
        await changePassword({ id: 1, oldPassword: 'old', newPassword: 'new' }, callback);

        expect(callback).toHaveBeenCalledWith({
            responseCode: '000',
            responseMessage: 'Password changed successfully'
        });
    });

    it('should return error for wrong old password', async () => {
        const mockUser = {
            validatePassword: jest.fn().mockReturnValue(false)
        };
        credential.findOne.mockResolvedValue(mockUser);

        const callback = jest.fn();
        await changePassword({ id: 1, oldPassword: 'wrong', newPassword: 'new' }, callback);

        expect(callback).toHaveBeenCalledWith({
            responseCode: '902',
            responseMessage: 'Password mismatch'
        });
    });
});

describe('fetchAllCorporate', () => {
    it('should fetch all corporates matching query', async () => {
        const mockResult = [{ id: 1, username: 'corp1' }];
        credential.findAll.mockResolvedValue(mockResult);

        const result = await fetchAllCorporate('corp');
        expect(result).toEqual(mockResult);
    });
});
