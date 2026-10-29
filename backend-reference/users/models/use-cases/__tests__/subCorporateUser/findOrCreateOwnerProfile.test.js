const { findOrCreateOwnerProfile } = require('../../subCorporateUser');
const SubCorporateUsers = require('../../../entities/subCorporateUsers');

jest.mock('../../../entities/subCorporateUsers', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({ hasMany: jest.fn() }));
jest.mock('../../../../utils/emailer', () => ({ email: jest.fn() }));
jest.mock('../../../../utils/emailTemplate/userManagement', () => ({}));

const INPUT = {
    credentialId: 153,
    corporateUserId: 42,
    name: 'Asha Verma',
    email: 'asha@peko.in',
    mobileNo: '9812345678',
    serviceLabel: 'Corporate Cards',
};

describe('findOrCreateOwnerProfile', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns the existing row untouched, and reports it as not newly created', async () => {
        SubCorporateUsers.findOne.mockResolvedValue({ id: '500' });

        const result = await findOrCreateOwnerProfile(INPUT);

        expect(result).toEqual({ ok: true, profile: { id: '500' }, created: false });
        expect(SubCorporateUsers.create).not.toHaveBeenCalled();
    });

    // credentialId === corporateCredentialID is the structural owner marker every listing keys off, and the
    // services entry is what makes the row resolve through the same service-scoped lookup a member's does.
    it('creates the row with the owner marker, the Admin role and the service entry', async () => {
        SubCorporateUsers.findOne.mockResolvedValue(null);
        SubCorporateUsers.create.mockResolvedValue({ id: '500' });

        const result = await findOrCreateOwnerProfile(INPUT);

        expect(result).toEqual({ ok: true, profile: { id: '500' }, created: true });
        expect(SubCorporateUsers.create).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Asha Verma',
            mobileNo: '9812345678',
            role: 'Admin',
            credentialId: 153,
            corporateCredentialID: '153',
            corporateUserId: 42,
            status: 'ACTIVE',
            services: [{ label: 'Corporate Cards', hasAccess: true }],
        }));
    });

    // THE product decision: one person may hold more than one cardholder row — most obviously the account
    // owner, who is commonly also a member — so a mobile already in use must not block the write. Asserted by
    // the absence of any lookup other than the owner-row read, so reinstating a uniqueness probe fails here.
    it('allows a mobile that another cardholder row already holds', async () => {
        SubCorporateUsers.findOne.mockResolvedValue(null);
        SubCorporateUsers.create.mockResolvedValue({ id: '500' });

        const result = await findOrCreateOwnerProfile(INPUT);

        expect(result.ok).toBe(true);
        expect(SubCorporateUsers.findOne).toHaveBeenCalledTimes(1);
        const [{ where }] = SubCorporateUsers.findOne.mock.calls[0];
        expect(where.mobileNo).toBeUndefined();
    });

    it('refuses a blank name rather than inventing a placeholder that fails vendor KYC later', async () => {
        SubCorporateUsers.findOne.mockResolvedValue(null);

        const result = await findOrCreateOwnerProfile({ ...INPUT, name: '   ' });

        expect(result.ok).toBe(false);
        expect(SubCorporateUsers.create).not.toHaveBeenCalled();
    });

    it.each([['0123456789'], ['12345'], ['5812345678'], ['']])(
        'refuses %s as a mobile number',
        async (mobileNo) => {
            SubCorporateUsers.findOne.mockResolvedValue(null);

            const result = await findOrCreateOwnerProfile({ ...INPUT, mobileNo });

            expect(result.ok).toBe(false);
            expect(SubCorporateUsers.create).not.toHaveBeenCalled();
        }
    );

    it('refuses without a session context', async () => {
        expect((await findOrCreateOwnerProfile({ ...INPUT, corporateUserId: null })).ok).toBe(false);
        expect(SubCorporateUsers.findOne).not.toHaveBeenCalled();
    });

    // Two concurrent first-switches can race between the read and the write; the loser re-reads rather than
    // surfacing an error, so both callers get the one row that won.
    it('re-reads and succeeds when a concurrent create won the race', async () => {
        SubCorporateUsers.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: '501' });
        SubCorporateUsers.create.mockRejectedValue(new Error('duplicate'));

        const result = await findOrCreateOwnerProfile(INPUT);

        expect(result).toEqual({ ok: true, profile: { id: '501' }, created: false });
    });

    it('reports a plain failure when the write fails and no row appeared', async () => {
        SubCorporateUsers.findOne.mockResolvedValue(null);
        SubCorporateUsers.create.mockRejectedValue(new Error('db down'));

        const result = await findOrCreateOwnerProfile(INPUT);

        expect(result.ok).toBe(false);
    });
});
