const { findPartnerPermissionsForSession } = require('../../../use-cases/partnerPermission');
const partnerPermission = require('../../../entities/partnerPermission');
const { findOneReferalCode } = require('../../../use-cases/referral_codes');

jest.mock('../../../entities/partnerPermission', () => ({
    findOne: jest.fn(),
}));

jest.mock('../../../use-cases/referral_codes', () => ({
    findOneReferalCode: jest.fn(),
}));

jest.mock('../../../use-cases/corporateUser', () => ({
    findOne: jest.fn(),
}));

const PARTNER_TREE = { permissions: [{ label: 'Payroll', hasAccess: true }] };
const REFERRAL_TREE = { permissions: [{ label: 'Payroll', hasAccess: true, via: 'referral' }] };
const DEFAULT_TREE = { permissions: [{ label: 'Payroll', hasAccess: false }] };

describe('findPartnerPermissionsForSession', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns the partner's own permissions when the partner has a row", async () => {
        partnerPermission.findOne.mockResolvedValueOnce(PARTNER_TREE);

        const result = await findPartnerPermissionsForSession({ registeredBy: 900 });

        expect(result).toBe(PARTNER_TREE);
        expect(partnerPermission.findOne).toHaveBeenCalledWith({
            where: { registeredBy: 900 },
            attributes: ['permissions'],
        });
    });

    it('falls back to the default permissions when the partner has no row', async () => {
        partnerPermission.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(DEFAULT_TREE);

        const result = await findPartnerPermissionsForSession({ registeredBy: 900 });

        expect(result).toBe(DEFAULT_TREE);
        expect(partnerPermission.findOne).toHaveBeenNthCalledWith(2, {
            where: { registeredBy: null },
            attributes: ['permissions'],
        });
    });

    it('falls back to the default permissions when the partner row has no permissions', async () => {
        partnerPermission.findOne
            .mockResolvedValueOnce({ permissions: null })
            .mockResolvedValueOnce(DEFAULT_TREE);

        const result = await findPartnerPermissionsForSession({ registeredBy: 900 });

        expect(result).toBe(DEFAULT_TREE);
    });

    it("resolves the referral owner's permissions when there is no partner", async () => {
        findOneReferalCode.mockResolvedValueOnce({ ownerCredentialId: 77 });
        partnerPermission.findOne.mockResolvedValueOnce(REFERRAL_TREE);

        const result = await findPartnerPermissionsForSession({ referralCode: 'RESELLER1' });

        expect(result).toBe(REFERRAL_TREE);
        expect(partnerPermission.findOne).toHaveBeenCalledWith({
            where: { registeredBy: 77 },
            attributes: ['permissions'],
        });
    });

    it('prefers the partner over the referral code when both are present', async () => {
        partnerPermission.findOne.mockResolvedValueOnce(PARTNER_TREE);

        const result = await findPartnerPermissionsForSession({
            registeredBy: 900,
            referralCode: 'RESELLER1',
        });

        expect(result).toBe(PARTNER_TREE);
        expect(findOneReferalCode).not.toHaveBeenCalled();
    });

    it('falls back to the default permissions when the referral code owner has no row', async () => {
        findOneReferalCode.mockResolvedValueOnce({ ownerCredentialId: 77 });
        partnerPermission.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(DEFAULT_TREE);

        const result = await findPartnerPermissionsForSession({ referralCode: 'RESELLER1' });

        expect(result).toBe(DEFAULT_TREE);
    });

    it('reads the default permissions directly for a direct corporate', async () => {
        partnerPermission.findOne.mockResolvedValueOnce(DEFAULT_TREE);

        const result = await findPartnerPermissionsForSession({});

        expect(result).toBe(DEFAULT_TREE);
        expect(partnerPermission.findOne).toHaveBeenCalledTimes(1);
        expect(partnerPermission.findOne).toHaveBeenCalledWith({
            where: { registeredBy: null },
            attributes: ['permissions'],
        });
    });

    it('propagates a database error instead of minting a session without permissions', async () => {
        partnerPermission.findOne.mockRejectedValue(new Error('Database error'));

        await expect(findPartnerPermissionsForSession({ registeredBy: 900 })).rejects.toThrow(
            'Database error'
        );
    });
});
