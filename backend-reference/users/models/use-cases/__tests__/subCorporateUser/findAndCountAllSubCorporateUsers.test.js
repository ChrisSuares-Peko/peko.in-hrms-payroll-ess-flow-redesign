const { findAndCountAllSubCorporateUsers } = require('../../subCorporateUser');
const SubCorporateUsers = require('../../../entities/subCorporateUsers');
const credential = require('../../../entities/credential');
const { Op } = require('sequelize');

jest.mock('../../../entities/subCorporateUsers', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    hasMany: jest.fn(),
}));

describe('SubCorporateUser Use-Cases - findAndCountAllSubCorporateUsers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find and count all sub-corporate users with given conditions', async () => {
        const params = {
            limit: 10,
            offset: 0,
            corporateId: 'corporateId123',
            status: 'ACTIVE',
            searchText: 'John'
        };
        const expectedResponse = {
            count: 1,
            rows: [{
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                mobileNo: '1234567890',
                role: 'Manager',
                status: 'ACTIVE',
                credential: { username: 'john_doe' }
            }]
        };

        SubCorporateUsers.findAndCountAll.mockResolvedValue(expectedResponse);

        const result = await findAndCountAllSubCorporateUsers(params);

        expect(SubCorporateUsers.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: credential,
                    attributes: ['username']
                }
            ],
            where: {
                corporateUserId: 'corporateId123',
                isDeleted: false,
                // The owner's own cardholder row is an identity, not a member — never listed or counted.
                // Derived from the credential pairing, so it arrives as a literal rather than a column value.
                [Op.and]: [expect.anything()],
                status: 'ACTIVE',
                [Op.or]: [
                    { name: { [Op.like]: '%John%' } },
                    { email: { [Op.like]: '%John%' } },
                    { mobileNo: { [Op.like]: '%John%' } },
                    { role: { [Op.like]: '%John%' } },
                ]
            },
            limit: 10,
            offset: 0,
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true
        });
        expect(result).toEqual(expectedResponse);
    });

    it('should return false if an error occurs', async () => {
        const params = {
            limit: 10,
            offset: 0,
            corporateId: 'corporateId123',
        };

        SubCorporateUsers.findAndCountAll.mockRejectedValue(new Error('Database error'));

        const result = await findAndCountAllSubCorporateUsers(params);

        expect(SubCorporateUsers.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: credential,
                    attributes: ['username']
                }
            ],
            where: {
                corporateUserId: 'corporateId123',
                isDeleted: false,
                // The owner's own cardholder row is an identity, not a member — never listed or counted.
                // Derived from the credential pairing, so it arrives as a literal rather than a column value.
                [Op.and]: [expect.anything()],
            },
            limit: 10,
            offset: 0,
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true
        });
        expect(result).toBe(false);
    });

    it('should handle case when `status` is null', async () => {
        const params = {
            limit: 10,
            offset: 0,
            corporateId: 'corporateId123',
            status: null,
            searchText: 'John'
        };
        const expectedResponse = {
            count: 1,
            rows: [{
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                mobileNo: '1234567890',
                role: 'Manager',
                status: 'ACTIVE',
                credential: { username: 'john_doe' }
            }]
        };

        SubCorporateUsers.findAndCountAll.mockResolvedValue(expectedResponse);

        const result = await findAndCountAllSubCorporateUsers(params);

        expect(SubCorporateUsers.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: credential,
                    attributes: ['username']
                }
            ],
            where: {
                corporateUserId: 'corporateId123',
                isDeleted: false,
                // The owner's own cardholder row is an identity, not a member — never listed or counted.
                // Derived from the credential pairing, so it arrives as a literal rather than a column value.
                [Op.and]: [expect.anything()],
                [Op.or]: [
                    { name: { [Op.like]: '%John%' } },
                    { email: { [Op.like]: '%John%' } },
                    { mobileNo: { [Op.like]: '%John%' } },
                    { role: { [Op.like]: '%John%' } },
                ]
            },
            limit: 10,
            offset: 0,
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true
        });
        expect(result).toEqual(expectedResponse);
    });

    it('should handle case when `searchText` is null', async () => {
        const params = {
            limit: 10,
            offset: 0,
            corporateId: 'corporateId123',
            status: 'ACTIVE',
            searchText: null
        };
        const expectedResponse = {
            count: 1,
            rows: [{
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                mobileNo: '1234567890',
                role: 'Manager',
                status: 'ACTIVE',
                credential: { username: 'john_doe' }
            }]
        };

        SubCorporateUsers.findAndCountAll.mockResolvedValue(expectedResponse);

        const result = await findAndCountAllSubCorporateUsers(params);

        expect(SubCorporateUsers.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: credential,
                    attributes: ['username']
                }
            ],
            where: {
                corporateUserId: 'corporateId123',
                isDeleted: false,
                // The owner's own cardholder row is an identity, not a member — never listed or counted.
                // Derived from the credential pairing, so it arrives as a literal rather than a column value.
                [Op.and]: [expect.anything()],
                status: 'ACTIVE'
            },
            limit: 10,
            offset: 0,
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true
        });
        expect(result).toEqual(expectedResponse);
    });

    it('should handle case when `limit` and `offset` are not provided', async () => {
        const params = {
            corporateId: 'corporateId123',
            status: 'ACTIVE',
            searchText: 'John'
        };
        const expectedResponse = {
            count: 1,
            rows: [{
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                mobileNo: '1234567890',
                role: 'Manager',
                status: 'ACTIVE',
                credential: { username: 'john_doe' }
            }]
        };

        SubCorporateUsers.findAndCountAll.mockResolvedValue(expectedResponse);

        const result = await findAndCountAllSubCorporateUsers(params);

        expect(SubCorporateUsers.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: credential,
                    attributes: ['username']
                }
            ],
            where: {
                corporateUserId: 'corporateId123',
                isDeleted: false,
                // The owner's own cardholder row is an identity, not a member — never listed or counted.
                // Derived from the credential pairing, so it arrives as a literal rather than a column value.
                [Op.and]: [expect.anything()],
                status: 'ACTIVE',
                [Op.or]: [
                    { name: { [Op.like]: '%John%' } },
                    { email: { [Op.like]: '%John%' } },
                    { mobileNo: { [Op.like]: '%John%' } },
                    { role: { [Op.like]: '%John%' } },
                ]
            },
            limit: undefined, // Behavior when not provided
            offset: undefined, // Behavior when not provided
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true
        });
        expect(result).toEqual(expectedResponse);
    });

    it('should handle case when `corporateId` is not provided', async () => {
        const params = {
            limit: 10,
            offset: 0,
            status: 'ACTIVE',
            searchText: 'John'
        };
        const expectedResponse = {
            count: 1,
            rows: [{
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                mobileNo: '1234567890',
                role: 'Manager',
                status: 'ACTIVE',
                credential: { username: 'john_doe' }
            }]
        };

        SubCorporateUsers.findAndCountAll.mockResolvedValue(expectedResponse);

        const result = await findAndCountAllSubCorporateUsers(params);

        expect(SubCorporateUsers.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: credential,
                    attributes: ['username']
                }
            ],
            where: {
                isDeleted: false,
                // The owner's own cardholder row is an identity, not a member — never listed or counted.
                // Derived from the credential pairing, so it arrives as a literal rather than a column value.
                [Op.and]: [expect.anything()],
                status: 'ACTIVE',
                [Op.or]: [
                    { name: { [Op.like]: '%John%' } },
                    { email: { [Op.like]: '%John%' } },
                    { mobileNo: { [Op.like]: '%John%' } },
                    { role: { [Op.like]: '%John%' } },
                ]
            },
            limit: 10,
            offset: 0,
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true
        });
        expect(result).toEqual(expectedResponse);
    });

    it('should handle empty result set', async () => {
        const params = {
            limit: 10,
            offset: 0,
            corporateId: 'corporateId123',
            status: 'ACTIVE',
            searchText: 'NonExistentUser'
        };
        const expectedResponse = {
            count: 0,
            rows: []
        };

        SubCorporateUsers.findAndCountAll.mockResolvedValue(expectedResponse);

        const result = await findAndCountAllSubCorporateUsers(params);

        expect(SubCorporateUsers.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: credential,
                    attributes: ['username']
                }
            ],
            where: {
                corporateUserId: 'corporateId123',
                isDeleted: false,
                // The owner's own cardholder row is an identity, not a member — never listed or counted.
                // Derived from the credential pairing, so it arrives as a literal rather than a column value.
                [Op.and]: [expect.anything()],
                status: 'ACTIVE',
                [Op.or]: [
                    { name: { [Op.like]: '%NonExistentUser%' } },
                    { email: { [Op.like]: '%NonExistentUser%' } },
                    { mobileNo: { [Op.like]: '%NonExistentUser%' } },
                    { role: { [Op.like]: '%NonExistentUser%' } },
                ]
            },
            limit: 10,
            offset: 0,
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true
        });
        expect(result).toEqual(expectedResponse);
    });
    afterAll(() => {
        jest.resetAllMocks();
    });
});
