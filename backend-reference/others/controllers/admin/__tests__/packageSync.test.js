const Package = require('../../../models/entities/package');
const sequelize = require('../../../configs/database/index');
const registry = require('../../../utils/packageSync');
const { buildDiff } = require('../../../utils/packageSync/reconcile');
const { preview, apply } = require('../packageSync');

jest.mock('../../../utils/packageSync', () => ({
    listProviders: jest.fn(),
    getProvider: jest.fn(),
    describeProvider: jest.fn(p => ({ accessKey: p.accessKey, label: p.label })),
    normalizePartnerId: jest.fn(id => (id === 'default' ? null : String(id))),
    loadVendorPlans: jest.fn(),
}));

const provider = { accessKey: 'peko_pos', label: 'Peko POS', packageAccessCode: 'peko_pos', syncedFields: ['packageName'] };
const vendorPlans = [{ externalId: 'v1', fields: { packageName: 'Base' }, raw: {} }];
const localRow = { id: 7, externalId: 'v1', packageName: 'Old', status: 1 };

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const mockReq = body => ({ body, user: { id: 42 }, LogTraceId: 'trace' });
const run = async (handler, body) => {
    const res = mockRes();
    const next = jest.fn();
    await handler(mockReq(body), res, next);
    return { res, next, payload: res.json.mock.calls[0]?.[0] };
};
const opIdFor = (locals, kind) => buildDiff({ vendorPlans, localPackages: locals, syncedFields: provider.syncedFields }).ops.find(op => op.kind === kind).id;

describe('preview', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        registry.getProvider.mockReturnValue(provider);
        registry.loadVendorPlans.mockResolvedValue(vendorPlans);
    });

    it('fetches the vendor once and diffs every requested partner independently', async () => {
        Package.findAll.mockResolvedValueOnce([localRow]).mockResolvedValueOnce([]);

        const { res, payload } = await run(preview, { accessKey: 'peko_pos', type: '2', partnerIds: ['default', 12] });

        expect(registry.loadVendorPlans).toHaveBeenCalledTimes(1);
        expect(Package.findAll).toHaveBeenNthCalledWith(1, { where: { accessCode: 'peko_pos', type: '2', partnerId: null }, raw: true });
        expect(Package.findAll).toHaveBeenNthCalledWith(2, { where: { accessCode: 'peko_pos', type: '2', partnerId: '12' }, raw: true });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(payload.data.vendor.count).toBe(1);
        expect(payload.data.partners.map(p => p.partnerId)).toEqual(['default', '12']);
        expect(payload.data.partners[0].ops[0]).toMatchObject({ kind: 'update', packageId: 7 });
        expect(payload.data.partners[1].ops[0]).toMatchObject({ kind: 'add', externalId: 'v1' });
    });

    it('rejects an unknown provider before touching the vendor', async () => {
        registry.getProvider.mockReturnValue(null);
        const { next } = await run(preview, { accessKey: 'nope', type: '2', partnerIds: ['default'] });
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }));
        expect(registry.loadVendorPlans).not.toHaveBeenCalled();
    });

    it('writes nothing and forwards the error when the vendor fails', async () => {
        const err = new Error('vendor down');
        registry.loadVendorPlans.mockRejectedValue(err);
        const { next } = await run(preview, { accessKey: 'peko_pos', type: '2', partnerIds: ['default'] });
        expect(next).toHaveBeenCalledWith(err);
        expect(Package.findAll).not.toHaveBeenCalled();
    });
});

describe('apply', () => {
    let transaction;

    beforeEach(() => {
        jest.clearAllMocks();
        registry.getProvider.mockReturnValue(provider);
        registry.loadVendorPlans.mockResolvedValue(vendorPlans);
        transaction = { commit: jest.fn(), rollback: jest.fn() };
        sequelize.transaction.mockResolvedValue(transaction);
    });

    it('applies an exact op id inside a transaction and commits', async () => {
        Package.findAll.mockResolvedValue([localRow]);
        Package.update.mockResolvedValue([1]);
        const opId = opIdFor([localRow], 'update');

        const { res, payload } = await run(apply, { accessKey: 'peko_pos', type: '2', partners: [{ partnerId: 'default', opIds: [opId] }] });

        expect(Package.update).toHaveBeenCalledWith({ packageName: 'Base' }, { where: { id: 7 }, transaction });
        expect(transaction.commit).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(payload.data.partners[0]).toMatchObject({ partnerId: 'default', counts: { added: 0, updated: 1, deactivated: 0 }, skipped: [] });
        expect(payload.data.partners[0].applied).toEqual([{ opId, kind: 'update', packageId: 7 }]);
    });

    it('creates an inactive package for an add op', async () => {
        Package.findAll.mockResolvedValue([]);
        Package.create.mockResolvedValue({ id: 99 });
        const opId = opIdFor([], 'add');

        const { payload } = await run(apply, { accessKey: 'peko_pos', type: '1', partners: [{ partnerId: 12, opIds: [opId] }] });

        expect(Package.create).toHaveBeenCalledWith(
            {
                packageName: 'Base',
                externalId: 'v1',
                status: false,
                packageType: 'INDIVIDUAL',
                accessCode: 'peko_pos',
                type: '1',
                partnerId: '12',
                packagePrices: { monthly: 0, annually: 0 },
                discount: { monthly: 0, annually: 0 },
            },
            { transaction }
        );
        expect(payload.data.partners[0]).toMatchObject({ partnerId: '12', counts: { added: 1, updated: 0, deactivated: 0 } });
    });

    it('skips a stale fingerprint and an unknown key without writing', async () => {
        Package.findAll.mockResolvedValue([localRow]);
        const stale = `${opIdFor([localRow], 'update').split('#')[0]}#00000000`;

        const { payload } = await run(apply, {
            accessKey: 'peko_pos',
            type: '2',
            partners: [{ partnerId: 'default', opIds: [stale, 'add:zzz#00000000'] }],
        });

        expect(Package.update).not.toHaveBeenCalled();
        expect(Package.create).not.toHaveBeenCalled();
        expect(payload.data.partners[0].skipped).toEqual([
            { opId: stale, reason: 'stale' },
            { opId: 'add:zzz#00000000', reason: 'missing' },
        ]);
        expect(transaction.commit).toHaveBeenCalled();
    });

    it('rolls back only the partner whose row changed underneath it and still returns 200 for the other', async () => {
        Package.findAll.mockResolvedValue([localRow]);
        Package.update.mockResolvedValueOnce([0]).mockResolvedValueOnce([1]);
        const opId = opIdFor([localRow], 'update');

        const { res, payload } = await run(apply, {
            accessKey: 'peko_pos',
            type: '2',
            partners: [
                { partnerId: 'default', opIds: [opId] },
                { partnerId: 12, opIds: [opId] },
            ],
        });

        expect(transaction.rollback).toHaveBeenCalledTimes(1);
        expect(transaction.commit).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(payload.data.partners[0]).toMatchObject({ partnerId: 'default', counts: { added: 0, updated: 0, deactivated: 0 }, error: expect.any(String) });
        expect(payload.data.partners[1]).toMatchObject({ partnerId: '12', counts: { updated: 1 } });
    });

    it('returns 500 when every partner rolled back', async () => {
        Package.findAll.mockResolvedValue([localRow]);
        Package.update.mockResolvedValue([0]);
        const opId = opIdFor([localRow], 'update');

        const { res, payload } = await run(apply, { accessKey: 'peko_pos', type: '2', partners: [{ partnerId: 'default', opIds: [opId] }] });

        expect(res.status).toHaveBeenCalledWith(500);
        expect(payload.status).toBe(false);
    });

    it('never reads or writes when the vendor fetch fails', async () => {
        registry.loadVendorPlans.mockRejectedValue(new Error('vendor down'));
        const { next } = await run(apply, { accessKey: 'peko_pos', type: '2', partners: [{ partnerId: 'default', opIds: ['add:v1#00000000'] }] });
        expect(next).toHaveBeenCalled();
        expect(Package.findAll).not.toHaveBeenCalled();
        expect(sequelize.transaction).not.toHaveBeenCalled();
    });
});
