import { UserPayload } from '@customtypes/general';

export type PackageSyncType = '1' | '2';

export const PACKAGE_SYNC_TYPE: Record<'packages' | 'servicePackages', PackageSyncType> = {
    packages: '1',
    servicePackages: '2',
};

export type SyncProvider = {
    accessKey: string;
    label: string;
    packageAccessCode: string;
    syncedFields: string[];
};

export type SyncOpKind = 'add' | 'update' | 'deactivate' | 'unchanged' | 'unmapped' | 'conflict';

export type SyncChangeValue = string | number | boolean | null;

export type SyncFieldChange = { from: SyncChangeValue; to: SyncChangeValue };

export type SyncOpHint = { externalId: string; packageName: string; opId: string };

export type SyncOp = {
    id: string;
    key: string;
    fingerprint: string;
    kind: SyncOpKind;
    externalId: string | null;
    packageId?: number;
    packageIds?: number[];
    packageName: string;
    changes?: Record<string, SyncFieldChange>;
    hint?: SyncOpHint;
    reason?: string;
    selectable: boolean;
};

export type SyncSummary = Record<SyncOpKind, number>;

export type SyncPartnerPreview = {
    partnerId: string;
    localCount: number;
    summary: SyncSummary;
    ops: SyncOp[];
};

export type SyncPreview = {
    provider: SyncProvider;
    type: PackageSyncType;
    vendor: { count: number; fetchedAt: string };
    partners: SyncPartnerPreview[];
};

export type SyncPreviewPayload = UserPayload & {
    accessKey: string;
    type: PackageSyncType;
    partnerIds: string[];
};

export type SyncPreviewResult = { ok: true; data: SyncPreview } | { ok: false; message: string };

export type SyncApplyPartner = { partnerId: string; opIds: string[] };

export type SyncApplyPayload = UserPayload & {
    accessKey: string;
    type: PackageSyncType;
    partners: SyncApplyPartner[];
};

export type SyncApplyCounts = { added: number; updated: number; deactivated: number };

export type SyncApplyPartnerResult = {
    partnerId: string;
    counts: SyncApplyCounts;
    applied: { opId: string; kind: SyncOpKind; packageId: number }[];
    skipped: { opId: string; reason: string }[];
    error?: string;
};

export type SyncApplyResult = {
    provider: SyncProvider;
    type: PackageSyncType;
    partners: SyncApplyPartnerResult[];
};

export type SyncSelection = Record<string, Set<string>>;
