import React from 'react';

import {
    CheckCircleFilled,
    CloseCircleFilled,
    ExclamationCircleFilled,
    LoadingOutlined,
} from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import { ProgressItem, SavingSummaryData } from '../hooks/useSubmitProgress';

const { Text } = Typography;

type Tone = 'muted' | 'warn' | 'block';

interface ItemDesc {
    icon: React.ReactNode;
    primary: string;
    chips: string[];
    filename?: string;
    trailing: string;
    tone: Tone;
    trailingTitle?: string;
}

const ICONS = {
    done: <CheckCircleFilled style={{ color: '#26A411', fontSize: 12 }} />,
    warn: <ExclamationCircleFilled style={{ color: '#FAAD14', fontSize: 12 }} />,
    block: <CloseCircleFilled style={{ color: '#FF4F4F', fontSize: 12 }} />,
    active: <LoadingOutlined style={{ color: '#FF4F4F', fontSize: 12 }} spin />,
    pending: (
        <span
            style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#E5E7EB',
            }}
        />
    ),
};

const describe = (item: ProgressItem): ItemDesc => {
    if (item.stage === 'validating_item') {
        const shared = {
            primary: item.field_label ?? '',
            chips: item.section_title ? [item.section_title] : [],
            tone: 'muted' as Tone,
        };
        if (item.status === 'ok') return { ...shared, icon: ICONS.done, trailing: 'Valid' };
        if (item.status === 'issue') {
            return { ...shared, icon: ICONS.warn, tone: 'warn', trailing: 'Needs attention' };
        }
        return { ...shared, icon: ICONS.active, trailing: 'Checking…' };
    }

    if (item.stage === 'processing_item') {
        const shared = {
            primary: item.field_label ?? '',
            filename: item.filename,
            chips: item.size_mb != null ? [`${item.size_mb} MB`] : [],
            tone: 'muted' as Tone,
        };
        if (item.status === 'queued') return { ...shared, icon: ICONS.pending, trailing: 'Queued' };
        if (item.status === 'uploading') {
            return { ...shared, icon: ICONS.active, trailing: 'Uploading…' };
        }
        return { ...shared, icon: ICONS.done, trailing: 'Uploaded' };
    }

    if (item.stage === 'saving_item') {
        const shared = { primary: item.label ?? '', chips: [], tone: 'muted' as Tone };
        if (item.status === 'done') return { ...shared, icon: ICONS.done, trailing: 'Saved' };
        return { ...shared, icon: ICONS.active, trailing: 'Saving…' };
    }

    // compliance_check
    const shared = {
        primary:
            (item.field_label ?? '') + (item.entity_name ? `  ·  ${item.entity_name}` : ''),
        chips: item.section_title ? [item.section_title] : [],
        tone: 'muted' as Tone,
    };
    if (item.status === 'clear') return { ...shared, icon: ICONS.done, trailing: 'Clear' };
    if (item.status === 'review') {
        return {
            ...shared,
            icon: ICONS.warn,
            tone: 'warn',
            trailing: 'Flagged',
            trailingTitle: (item.matched_names ?? []).join(', '),
        };
    }
    if (item.status === 'blocked') {
        return { ...shared, icon: ICONS.block, tone: 'block', trailing: 'Match · blocked' };
    }
    return { ...shared, icon: ICONS.active, trailing: 'Screening…' };
};

const TRAIL_COLOR: Record<Tone, string> = {
    muted: '#9CA3AF',
    warn: '#D97706',
    block: '#FF4F4F',
};

export const SubmitItemRow: React.FC<{ item: ProgressItem }> = ({ item }) => {
    const d = describe(item);
    return (
        <Flex align="center" gap={8} style={{ padding: '3px 4px', minWidth: 0 }}>
            <span style={{ flexShrink: 0, display: 'inline-flex', width: 14 }}>{d.icon}</span>
            <Flex align="center" gap={6} style={{ minWidth: 0, flex: 1 }}>
                {d.filename && (
                    <code
                        title={d.filename}
                        style={{
                            fontSize: 11,
                            padding: '0 6px',
                            border: '1px solid #E5E7EB',
                            background: '#FAFAFA',
                            borderRadius: 4,
                            maxWidth: 160,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {d.filename}
                    </code>
                )}
                <Text
                    className="text-xs text-neutral-700"
                    style={{
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                    title={d.primary}
                >
                    {d.primary}
                </Text>
                {d.chips.map(chip => (
                    <span
                        key={chip}
                        style={{
                            fontSize: 10,
                            padding: '0 6px',
                            background: '#F3F4F6',
                            color: '#6B7280',
                            borderRadius: 4,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                        }}
                    >
                        {chip}
                    </span>
                ))}
            </Flex>
            <span
                title={d.trailingTitle}
                style={{
                    fontSize: 11,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    color: TRAIL_COLOR[d.tone],
                    fontWeight: d.tone === 'muted' ? 400 : 500,
                }}
            >
                {d.trailing}
            </span>
        </Flex>
    );
};

export const SavingSummary: React.FC<{ summary: SavingSummaryData }> = ({ summary }) => (
    <div
        style={{
            marginTop: 6,
            border: '1px solid rgba(255, 79, 79, 0.2)',
            background: 'rgba(255, 79, 79, 0.04)',
            borderRadius: 8,
            padding: 10,
        }}
    >
        <Flex align="center" gap={8}>
            <span
                style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    background: '#FF4F4F',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                {(summary.proposed_name || '?').charAt(0)}
            </span>
            <Text className="text-sm font-semibold text-neutral-900">
                {summary.proposed_name}
            </Text>
        </Flex>
        <div style={{ paddingLeft: 28, marginTop: 2 }}>
            <Text className="text-xs text-neutral-500" style={{ fontFamily: 'monospace' }}>
                Ref {summary.reference_id ?? '—'}
                {summary.application_id != null ? ` · App #${summary.application_id}` : ''}
            </Text>
        </div>
    </div>
);
