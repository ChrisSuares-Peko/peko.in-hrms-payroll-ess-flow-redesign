const { Op } = require('sequelize');
const partnerServiceAccess = require('../../../entities/partnerServiceAccess');
const systemUser = require('../../../entities/systemUser');
const {
    findPartnerServiceAccess,
    fetchAllPartnerServiceAccess,
    replacePartnerServiceAccess,
    updatePartnerServiceAccessById,
    deletePartnerServiceAccessById,
    isPartnerCredential,
} = require('../../partnerServiceAccess');

jest.mock('../../../../configs/database/index', () => ({}));
jest.mock('../../../entities/partnerServiceAccess', () => ({
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
}));
jest.mock('../../../entities/systemUser', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/roleAndPermissions', () => ({}));
jest.mock('../../../entities/credential', () => ({}));

describe('partnerServiceAccess use-cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findPartnerServiceAccess', () => {
        it('only returns an active override for the partner', async () => {
            partnerServiceAccess.findOne.mockResolvedValue({ id: 1 });

            await findPartnerServiceAccess(42);

            expect(partnerServiceAccess.findOne).toHaveBeenCalledWith(
                expect.objectContaining({ where: { partnerId: 42, status: true } })
            );
        });
    });

    describe('fetchAllPartnerServiceAccess', () => {
        it('omits partnerId and status from the filter when they are not supplied', async () => {
            partnerServiceAccess.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await fetchAllPartnerServiceAccess({});

            expect(partnerServiceAccess.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({ where: {} })
            );
        });

        it('filters on partnerId and status when supplied', async () => {
            partnerServiceAccess.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await fetchAllPartnerServiceAccess({ partnerId: 42, status: false });

            expect(partnerServiceAccess.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({ where: { partnerId: 42, status: false } })
            );
        });

        it('searches both the partner id and the joined partner name', async () => {
            partnerServiceAccess.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await fetchAllPartnerServiceAccess({ searchText: 'acme' });

            const { where } = partnerServiceAccess.findAndCountAll.mock.calls[0][0];
            expect(where[Op.or]).toEqual([
                { partnerId: { [Op.like]: '%acme%' } },
                { '$credential.name$': { [Op.like]: '%acme%' } },
            ]);
        });

        it('passes the paging window through', async () => {
            partnerServiceAccess.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await fetchAllPartnerServiceAccess({ limit: 10, offset: 20 });

            expect(partnerServiceAccess.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({ limit: 10, offset: 20 })
            );
        });
    });

    describe('replacePartnerServiceAccess', () => {
        it('upserts the override active and returns the stored row', async () => {
            const stored = { id: 1, partnerId: 42, permissions: [], status: true };
            partnerServiceAccess.findOne.mockResolvedValue(stored);

            const result = await replacePartnerServiceAccess(42, [{ serviceCategory: 'Users' }]);

            expect(partnerServiceAccess.upsert).toHaveBeenCalledWith({
                partnerId: 42,
                permissions: [{ serviceCategory: 'Users' }],
                status: true,
            });
            expect(partnerServiceAccess.findOne).toHaveBeenCalledWith(
                expect.objectContaining({ where: { partnerId: 42 } })
            );
            expect(result).toEqual(stored);
        });
    });

    describe('updatePartnerServiceAccessById', () => {
        it('returns the affected row count so a missing row reads as 0', async () => {
            partnerServiceAccess.update.mockResolvedValue([0]);

            const result = await updatePartnerServiceAccessById(7, { status: false });

            expect(partnerServiceAccess.update).toHaveBeenCalledWith(
                { status: false },
                { where: { id: 7 } }
            );
            expect(result).toBe(0);
        });

        it('returns 1 when a row was updated', async () => {
            partnerServiceAccess.update.mockResolvedValue([1]);

            expect(await updatePartnerServiceAccessById(7, { status: true })).toBe(1);
        });
    });

    describe('deletePartnerServiceAccessById', () => {
        it('destroys by id', async () => {
            partnerServiceAccess.destroy.mockResolvedValue(1);

            const result = await deletePartnerServiceAccessById(7);

            expect(partnerServiceAccess.destroy).toHaveBeenCalledWith({ where: { id: 7 } });
            expect(result).toBe(1);
        });
    });

    describe('isPartnerCredential', () => {
        it('is true only when a partner-role system user owns the credential', async () => {
            systemUser.findOne.mockResolvedValue({ id: 3 });

            expect(await isPartnerCredential(42)).toBe(true);

            const call = systemUser.findOne.mock.calls[0][0];
            expect(call.where).toEqual({ credentialId: 42 });
            expect(call.include[0].where).toEqual({ roleName: 'partner' });
            expect(call.include[0].required).toBe(true);
        });

        it('is false when the credential is not a partner', async () => {
            systemUser.findOne.mockResolvedValue(null);

            expect(await isPartnerCredential(42)).toBe(false);
        });
    });
});
