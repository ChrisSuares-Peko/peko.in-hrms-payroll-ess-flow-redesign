import { useMemo } from 'react';

import { SubmitUpdate } from '../types/forms';

// Port of vendor's CompanySubmitModal/useSubmitProgress reducer — groups the
// streamed sub-item events under their parent step and tracks the saving
// summary block.

export type ProgressStepKey = 'validating' | 'processing' | 'saving' | 'compliance';

export type ProgressItemStatus =
    | 'queued'
    | 'checking'
    | 'active'
    | 'uploading'
    | 'ok'
    | 'done'
    | 'clear'
    | 'issue'
    | 'review'
    | 'blocked';

export interface ProgressItem {
    key: string;
    stage: string;
    status: ProgressItemStatus;
    field_label?: string;
    section_title?: string;
    filename?: string;
    size_mb?: number;
    label?: string;
    entity_name?: string;
    match_count?: number;
    matched_names?: string[];
}

export interface SavingSummaryData {
    proposed_name?: string;
    reference_id?: string;
    tracking_id?: string;
    application_id?: number | string;
}

export interface SubmitProgress {
    itemsByStep: Record<ProgressStepKey, ProgressItem[]>;
    summary: SavingSummaryData | null;
}

const SUB_STAGE_PARENT: Record<string, ProgressStepKey> = {
    validating_item: 'validating',
    processing_item: 'processing',
    saving_item: 'saving',
    compliance_check: 'compliance',
};

// Higher rank wins when merging duplicate item events (a later "done" must
// not be regressed by an out-of-order "queued").
const ITEM_RANK: Record<ProgressItemStatus, number> = {
    queued: 1,
    checking: 1,
    active: 1,
    uploading: 2,
    ok: 3,
    done: 3,
    clear: 3,
    issue: 3,
    review: 3,
    blocked: 3,
};

const normalizeItemStatus = (stage: string, status: string): ProgressItemStatus => {
    if (stage === 'compliance_check') {
        if (status === 'success' || status === 'clear') return 'clear';
        if (status === 'warning' || status === 'review') return 'review';
        if (status === 'error' || status === 'blocked') return 'blocked';
        return 'checking';
    }
    if (status === 'completed') return 'done';
    return (status as ProgressItemStatus) || 'active';
};

export const buildSubmitProgress = (updates: SubmitUpdate[]): SubmitProgress => {
    const itemsByStep: Record<ProgressStepKey, ProgressItem[]> = {
        validating: [],
        processing: [],
        saving: [],
        compliance: [],
    };
    let summary: SavingSummaryData | null = null;

    updates.forEach(u => {
        const parent = SUB_STAGE_PARENT[u.stage];
        if (parent) {
            const status = normalizeItemStatus(u.stage, u.status);
            const incoming: ProgressItem = {
                key: u.key ?? `${u.stage}-${u.field_label ?? u.filename ?? u.label ?? u.entity_name ?? ''}`,
                stage: u.stage,
                status,
                field_label: u.field_label,
                section_title: u.section_title,
                filename: u.filename,
                size_mb: u.size_mb,
                label: u.label,
                entity_name: u.entity_name,
                match_count: u.match_count,
                matched_names: u.matched_names,
            };
            const list = itemsByStep[parent];
            const idx = list.findIndex(it => it.key === incoming.key);
            if (idx === -1) {
                list.push(incoming);
            } else if ((ITEM_RANK[status] ?? 0) >= (ITEM_RANK[list[idx].status] ?? 0)) {
                const merged = { ...list[idx] } as unknown as Record<string, unknown>;
                (Object.keys(incoming) as (keyof ProgressItem)[]).forEach(k => {
                    if (incoming[k] != null) {
                        merged[k] = incoming[k];
                    }
                });
                merged.status = status;
                list[idx] = merged as unknown as ProgressItem;
            }
            return;
        }

        if (u.stage === 'saving' && u.proposed_name) {
            summary = {
                proposed_name: u.proposed_name,
                reference_id: u.reference_id,
                tracking_id: u.tracking_id,
                application_id: u.application_id,
            };
        }
    });

    return { itemsByStep, summary };
};

export const useSubmitProgress = (updates: SubmitUpdate[]): SubmitProgress =>
    useMemo(() => buildSubmitProgress(updates), [updates]);
