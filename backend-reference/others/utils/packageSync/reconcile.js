const crypto = require('crypto');
const { clean } = require('./mapPlan');

const KIND_ORDER = ['add', 'update', 'deactivate', 'conflict', 'unmapped', 'unchanged'];
const SELECTABLE = new Set(['add', 'update', 'deactivate']);

const normalizeName = value => clean(value).toLowerCase().replace(/\s+/g, ' ');

const fingerprint = ({ kind, externalId, packageId, changes }) =>
    crypto
        .createHash('sha1')
        .update(JSON.stringify({ kind, externalId: externalId ?? null, packageId: packageId ?? null, changes: changes ?? null }))
        .digest('hex')
        .slice(0, 8);

const makeOp = op => {
    const key = `${op.kind}:${op.externalId || `pkg${op.packageId}`}`;
    const hash = fingerprint(op);
    return { ...op, key, fingerprint: hash, id: `${key}#${hash}`, selectable: SELECTABLE.has(op.kind) };
};

exports.KIND_ORDER = KIND_ORDER;
exports.normalizeName = normalizeName;
exports.splitOpId = opId => String(opId).split('#')[0];

exports.buildDiff = ({ vendorPlans, localPackages, syncedFields }) => {
    const ops = [];

    const vendorById = new Map();
    const vendorDuplicates = new Set();
    for (const plan of vendorPlans) {
        if (vendorById.has(plan.externalId)) vendorDuplicates.add(plan.externalId);
        else vendorById.set(plan.externalId, plan);
    }

    const localById = new Map();
    const unmapped = [];
    for (const pkg of localPackages) {
        const externalId = clean(pkg.externalId);
        if (!externalId) {
            unmapped.push(pkg);
            continue;
        }
        localById.set(externalId, [...(localById.get(externalId) || []), pkg]);
    }

    const addsByName = new Map();

    for (const [externalId, plan] of vendorById) {
        const group = localById.get(externalId) || [];
        if (vendorDuplicates.has(externalId) || group.length > 1) {
            ops.push(
                makeOp({
                    kind: 'conflict',
                    externalId,
                    packageIds: group.map(p => p.id),
                    packageName: plan.fields.packageName,
                    reason: group.length > 1 ? 'duplicate-local-externalId' : 'duplicate-vendor-plan',
                })
            );
            continue;
        }
        if (!group.length) {
            const changes = {};
            for (const field of syncedFields) changes[field] = { from: null, to: plan.fields[field] ?? '' };
            const op = makeOp({ kind: 'add', externalId, packageName: plan.fields.packageName, changes });
            ops.push(op);
            addsByName.set(normalizeName(plan.fields.packageName), op);
            continue;
        }
        const [pkg] = group;
        const changes = {};
        for (const field of syncedFields) {
            const to = clean(plan.fields[field]);
            if (clean(pkg[field]) !== to) changes[field] = { from: pkg[field] ?? null, to };
        }
        ops.push(
            makeOp(
                Object.keys(changes).length
                    ? { kind: 'update', externalId, packageId: pkg.id, packageName: pkg.packageName, changes }
                    : { kind: 'unchanged', externalId, packageId: pkg.id, packageName: pkg.packageName }
            )
        );
    }

    for (const [externalId, group] of localById) {
        if (vendorById.has(externalId)) continue;
        if (group.length > 1) {
            ops.push(
                makeOp({
                    kind: 'conflict',
                    externalId,
                    packageIds: group.map(p => p.id),
                    packageName: group[0].packageName,
                    reason: 'duplicate-local-externalId',
                })
            );
            continue;
        }
        const [pkg] = group;
        ops.push(
            makeOp(
                pkg.status
                    ? {
                          kind: 'deactivate',
                          externalId,
                          packageId: pkg.id,
                          packageName: pkg.packageName,
                          changes: { status: { from: true, to: false } },
                      }
                    : { kind: 'unchanged', externalId, packageId: pkg.id, packageName: pkg.packageName, reason: 'already-inactive' }
            )
        );
    }

    for (const pkg of unmapped) {
        const match = addsByName.get(normalizeName(pkg.packageName));
        ops.push(
            makeOp({
                kind: 'unmapped',
                externalId: null,
                packageId: pkg.id,
                packageName: pkg.packageName,
                ...(match ? { hint: { externalId: match.externalId, packageName: match.packageName, opId: match.id } } : {}),
            })
        );
    }

    ops.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.key.localeCompare(b.key));
    const summary = Object.fromEntries(KIND_ORDER.map(kind => [kind, ops.filter(op => op.kind === kind).length]));
    return { ops, summary };
};
