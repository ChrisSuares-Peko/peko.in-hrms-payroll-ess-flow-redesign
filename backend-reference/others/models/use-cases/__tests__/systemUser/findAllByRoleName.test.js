const { findAllByRoleName } = require('../../systemUser'); // Adjust the path as needed
const systemUser = require('../../../entities/systemUser');
const credential = require('../../../entities/credential');
const roleAndPermissions = require('../../../entities/roleAndPermissions');

jest.mock('../../../entities/systemUser', () => ({
    findAll: jest.fn(),
}));

describe('findAllByRoleName', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return credentials matching the query and role name', async () => {
        const mockQuery = 'test';
        const mockRoleName = 'admin';
        const mockUsers = [
            {
                credential: { id: 1, name: 'Test User 1' },
            },
            {
                credential: { id: 2, name: 'Test User 2' },
            },
        ];

        systemUser.findAll.mockResolvedValue(mockUsers);

        const result = await findAllByRoleName(mockQuery, mockRoleName);

        expect(systemUser.findAll).toHaveBeenCalledWith({
            attributes: [],
            where: {
                isActive: true,
            },
            include: [
                {
                    model: roleAndPermissions,
                    attributes: [],
                    where: {
                        roleName: mockRoleName,
                    },
                },
                {
                    model: credential,
                    attributes: ['id', 'name'],
                    where: {
                        [Symbol.for('or')]: [
                            {
                                name: {
                                    [Symbol.for('like')]: `%${mockQuery}%`,
                                },
                            },
                        ],
                    },
                },
            ],
        });

        expect(result).toEqual([
            { id: 1, name: 'Test User 1' },
            { id: 2, name: 'Test User 2' },
        ]);
    });

    it('should return an empty array if no users match the query and role name', async () => {
        const mockQuery = 'nonexistent';
        const mockRoleName = 'user';

        systemUser.findAll.mockResolvedValue([]);

        const result = await findAllByRoleName(mockQuery, mockRoleName);

        expect(systemUser.findAll).toHaveBeenCalledWith({
            attributes: [],
            where: {
                isActive: true,
            },
            include: [
                {
                    model: roleAndPermissions,
                    attributes: [],
                    where: {
                        roleName: mockRoleName,
                    },
                },
                {
                    model: credential,
                    attributes: ['id', 'name'],
                    where: {
                        [Symbol.for('or')]: [
                            {
                                name: {
                                    [Symbol.for('like')]: `%${mockQuery}%`,
                                },
                            },
                        ],
                    },
                },
            ],
        });

        expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
        const mockQuery = 'test';
        const mockRoleName = 'admin';
        const mockError = new Error('Database error');

        systemUser.findAll.mockRejectedValue(mockError);

        await expect(findAllByRoleName(mockQuery, mockRoleName)).rejects.toThrow('Database error');

        expect(systemUser.findAll).toHaveBeenCalledWith({
            attributes: [],
            where: {
                isActive: true,
            },
            include: [
                {
                    model: roleAndPermissions,
                    attributes: [],
                    where: {
                        roleName: mockRoleName,
                    },
                },
                {
                    model: credential,
                    attributes: ['id', 'name'],
                    where: {
                        [Symbol.for('or')]: [
                            {
                                name: {
                                    [Symbol.for('like')]: `%${mockQuery}%`,
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });
});
