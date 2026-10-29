const pkgModel = require('../../../entities/package');
const { clonePackageToPartner } = require('../../cashbackCopy');

jest.mock('../../../../configs/database/index', () => ({
    transaction: jest.fn(),
}));
jest.mock('../../../entities/cashback', () => ({}));
jest.mock('../../../entities/package', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
}));
jest.mock('../../../entities/serviceOperator', () => ({}));

const sourcePackage = {
    id: 7,
    packageName: 'Growth',
    aliasName: 'growth',
    packageType: 'GROUP',
    accessCode: 'GRW',
    partnerId: null,
    type: '1',
    status: true,
    packagePrices: { monthly: 100, annually: 1000 },
    discount: { monthly: 0, annually: 0 },
    externalId: 'zoho_item_1',
    vendorPlanId: 'plan_abc123',
    createdAt: 'created',
    updatedAt: 'updated',
};

const mockCreated = data => {
    pkgModel.create.mockResolvedValue({ get: () => ({ id: 99, ...data }) });
};

describe('clonePackageToPartner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('rejects when fromPackageId is missing', async () => {
        await expect(clonePackageToPartner({ toPartnerId: '42' })).rejects.toThrow(
            'fromPackageId is required'
        );
    });

    it('rejects when the source package does not exist', async () => {
        pkgModel.findOne.mockResolvedValue(null);

        await expect(
            clonePackageToPartner({ fromPackageId: 7, toPartnerId: '42' })
        ).rejects.toThrow('Source package 7 not found');
    });

    it('copies the source row without its id and timestamps and re-points partnerId', async () => {
        pkgModel.findOne.mockResolvedValueOnce(sourcePackage).mockResolvedValueOnce(null);
        mockCreated({});

        await clonePackageToPartner({ fromPackageId: 7, toPartnerId: '42' });

        const created = pkgModel.create.mock.calls[0][0];
        expect(created).not.toHaveProperty('id');
        expect(created).not.toHaveProperty('createdAt');
        expect(created).not.toHaveProperty('updatedAt');
        expect(created.partnerId).toBe('42');
        expect(created.packageName).toBe('Growth');
        expect(created.accessCode).toBe('GRW');
    });

    it('does not carry the source package vendor identity onto the clone', async () => {
        pkgModel.findOne.mockResolvedValueOnce(sourcePackage).mockResolvedValueOnce(null);
        mockCreated({});

        await clonePackageToPartner({ fromPackageId: 7, toPartnerId: '42' });

        const created = pkgModel.create.mock.calls[0][0];
        expect(created).not.toHaveProperty('externalId');
        expect(created).not.toHaveProperty('vendorPlanId');
    });

    it('maps a "default" destination to a null partnerId', async () => {
        pkgModel.findOne.mockResolvedValueOnce(sourcePackage).mockResolvedValueOnce(null);
        mockCreated({});

        await clonePackageToPartner({ fromPackageId: 7, toPartnerId: 'default' });

        expect(pkgModel.create.mock.calls[0][0].partnerId).toBeNull();
    });

    it('applies name, alias, price and discount overrides', async () => {
        pkgModel.findOne.mockResolvedValueOnce(sourcePackage).mockResolvedValueOnce(null);
        mockCreated({});

        await clonePackageToPartner({
            fromPackageId: 7,
            toPartnerId: '42',
            overrides: {
                packageName: '  Growth Plus  ',
                aliasName: '  growth-plus  ',
                packagePrices: { monthly: 250 },
                discount: { annually: 15 },
            },
        });

        const created = pkgModel.create.mock.calls[0][0];
        expect(created.packageName).toBe('Growth Plus');
        expect(created.aliasName).toBe('growth-plus');
        expect(created.packagePrices).toEqual({ monthly: 250, annually: 1000 });
        expect(created.discount).toEqual({ monthly: 0, annually: 15 });
    });

    it('clears the alias when an empty alias override is supplied', async () => {
        pkgModel.findOne.mockResolvedValueOnce(sourcePackage).mockResolvedValueOnce(null);
        mockCreated({});

        await clonePackageToPartner({
            fromPackageId: 7,
            toPartnerId: '42',
            overrides: { aliasName: '   ' },
        });

        expect(pkgModel.create.mock.calls[0][0].aliasName).toBeNull();
    });

    it('ignores a blank package name override and keeps the source name', async () => {
        pkgModel.findOne.mockResolvedValueOnce(sourcePackage).mockResolvedValueOnce(null);
        mockCreated({});

        await clonePackageToPartner({
            fromPackageId: 7,
            toPartnerId: '42',
            overrides: { packageName: '   ' },
        });

        expect(pkgModel.create.mock.calls[0][0].packageName).toBe('Growth');
    });

    it('rejects when the destination partner already has a package with that name', async () => {
        pkgModel.findOne.mockResolvedValueOnce(sourcePackage).mockResolvedValueOnce({ id: 55 });

        await expect(
            clonePackageToPartner({ fromPackageId: 7, toPartnerId: '42' })
        ).rejects.toThrow('A package named "Growth" already exists for this partner.');
        expect(pkgModel.create).not.toHaveBeenCalled();
    });

    it('checks for duplicates against the resolved destination partner and name', async () => {
        pkgModel.findOne.mockResolvedValueOnce(sourcePackage).mockResolvedValueOnce(null);
        mockCreated({});

        await clonePackageToPartner({
            fromPackageId: 7,
            toPartnerId: '42',
            overrides: { packageName: 'Growth Plus' },
        });

        expect(pkgModel.findOne).toHaveBeenNthCalledWith(2, {
            where: { partnerId: '42', packageName: 'Growth Plus' },
            attributes: ['id'],
            raw: true,
        });
    });

    it('returns the created row as a plain object', async () => {
        pkgModel.findOne.mockResolvedValueOnce(sourcePackage).mockResolvedValueOnce(null);
        pkgModel.create.mockResolvedValue({ get: () => ({ id: 99, packageName: 'Growth' }) });

        const result = await clonePackageToPartner({ fromPackageId: 7, toPartnerId: '42' });

        expect(result).toEqual({ id: 99, packageName: 'Growth' });
    });
});
