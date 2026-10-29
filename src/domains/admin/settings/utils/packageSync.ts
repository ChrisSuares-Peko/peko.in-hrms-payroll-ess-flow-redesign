import {
    SyncApplyPartner,
    SyncApplyResult,
    SyncChangeValue,
    SyncOp,
    SyncOpHint,
    SyncOpKind,
    SyncPreview,
    SyncSelection,
} from '../types/packageSync';

export const SYNC_KINDS: SyncOpKind[] = ['add', 'update', 'deactivate', 'conflict', 'unmapped', 'unchanged'];

export const SYNC_KIND_META: Record<
    SyncOpKind,
    { label: string; color: string; helper?: string; selectable: boolean }
> = {
    add: { label: 'Will be added', color: 'green', helper: 'created inactive', selectable: true },
    update: { label: 'Will be updated', color: 'blue', selectable: true },
    deactivate: { label: 'Will be deactivated', color: 'red', selectable: true },
    conflict: {
        label: 'Conflicts',
        color: 'volcano',
        helper: 'duplicate External ID locally',
        selectable: false,
    },
    unmapped: { label: 'Unmapped', color: 'orange', helper: 'not touched', selectable: false },
    unchanged: { label: 'Unchanged', color: 'default', selectable: false },
};

export const FIELD_LABELS: Record<string, string> = {
    packageName: 'Package name',
    description: 'Description',
    status: 'Status',
};

export const isActionable = (op: SyncOp) => op.selectable && SYNC_KIND_META[op.kind].selectable;

export const groupOps = (ops: SyncOp[]) =>
    ops.reduce<Record<SyncOpKind, SyncOp[]>>(
        (acc, op) => {
            acc[op.kind].push(op);
            return acc;
        },
        { add: [], update: [], deactivate: [], conflict: [], unmapped: [], unchanged: [] }
    );

export const defaultSelection = (preview: SyncPreview): SyncSelection =>
    Object.fromEntries(
        preview.partners.map(p => [p.partnerId, new Set(p.ops.filter(isActionable).map(op => op.id))])
    );

export const toggleOps = (
    selection: SyncSelection,
    partnerId: string,
    opIds: string[],
    checked: boolean
): SyncSelection => {
    const next = new Set(selection[partnerId] ?? []);
    opIds.forEach(id => (checked ? next.add(id) : next.delete(id)));
    return { ...selection, [partnerId]: next };
};

export const countSelected = (selection: SyncSelection) =>
    Object.values(selection).reduce((sum, set) => sum + set.size, 0);

export const buildApplyPartners = (preview: SyncPreview, selection: SyncSelection): SyncApplyPartner[] =>
    preview.partners
        .map(p => ({ partnerId: p.partnerId, opIds: [...(selection[p.partnerId] ?? [])] }))
        .filter(p => p.opIds.length > 0);

export const hasPendingChanges = (preview: SyncPreview) =>
    preview.partners.some(p => p.summary.add + p.summary.update + p.summary.deactivate > 0);

export const totalApplied = (result: SyncApplyResult) =>
    result.partners.reduce(
        (acc, p) => ({
            added: acc.added + p.counts.added,
            updated: acc.updated + p.counts.updated,
            deactivated: acc.deactivated + p.counts.deactivated,
            skipped: acc.skipped + p.skipped.length,
            failed: acc.failed + (p.error ? 1 : 0),
        }),
        { added: 0, updated: 0, deactivated: 0, skipped: 0, failed: 0 }
    );

export const summarizeApply = (result: SyncApplyResult) => {
    const t = totalApplied(result);
    const base = `Added ${t.added}, updated ${t.updated}, deactivated ${t.deactivated}`;
    const extras = [t.skipped > 0 && `${t.skipped} skipped`, t.failed > 0 && `${t.failed} partner(s) rolled back`]
        .filter(Boolean)
        .join(', ');
    return extras ? `${base} (${extras})` : base;
};

export const formatChangeValue = (value: SyncChangeValue) => {
    if (value === null || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Active' : 'Inactive';
    return String(value);
};

export const formatHint = (hint: SyncOpHint) =>
    `Vendor plan '${hint.packageName}' (${hint.externalId}) looks like this package — set its External ID to link it.`;
