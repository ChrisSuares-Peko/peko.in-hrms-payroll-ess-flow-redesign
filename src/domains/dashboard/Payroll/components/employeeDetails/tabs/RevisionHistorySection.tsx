import React from 'react';

import { Empty, Flex, Typography } from 'antd';
import dayjs from 'dayjs';

import { formatNumberWithLocalStringWithoutDecimalPoint, roundMoney } from '@utils/priceFormat';

import { SalaryRevisionHistoryEntry } from '../../../api/organizationSettings/index';

const { Text } = Typography;

const BORDER = '#E2E8F0';
const SECTION_BG = '#F8FAFC';

const fmtRupees = (amount: number) => `₹ ${formatNumberWithLocalStringWithoutDecimalPoint(roundMoney(amount))}`;

// Arrears status comes from the backend as a plain enum string (e.g. "PENDING") — display
// only, never re-used as a value, so title-casing it here doesn't affect any comparison
// logic elsewhere.
const titleCase = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const percentChange = (previous: number | null, current: number) => {
    if (!previous) return null;
    const pct = ((current - previous) / previous) * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
};

interface RevisionHistorySectionProps {
    entries: SalaryRevisionHistoryEntry[];
    isLoading?: boolean;
    onUndoLatest?: () => void;
    undoLoading?: boolean;
}

const RevisionHistorySection = ({ entries, isLoading, onUndoLatest, undoLoading }: RevisionHistorySectionProps) => {
    if (isLoading) return null;

    return (
        <div className="mt-6" style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
            <Flex
                align="center"
                justify="space-between"
                className="px-4"
                style={{ background: SECTION_BG, borderBottom: `1px solid ${BORDER}`, paddingTop: 8, paddingBottom: 8, minHeight: 44 }}
            >
                <Text className="font-medium text-sm" style={{ color: '#181D27' }}>
                    Revision History
                </Text>
            </Flex>
            {entries.length === 0 ? (
                <Flex justify="center" className="py-6">
                    <Empty description="No revisions yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </Flex>
            ) : (
                <div className="divide-y divide-[#F1F5F9]">
                    {entries.map((entry, index) => {
                        const pct = percentChange(entry.previousAnnualCTC, entry.annualCTC);
                        const subtitleParts = [
                            `Effective ${dayjs(entry.effectiveFrom).format('MMMM YYYY')}`,
                            entry.reason,
                        ].filter(Boolean);

                        return (
                            <Flex key={entry.id} justify="space-between" align="center" className="px-4 py-3">
                                <Flex vertical style={{ gap: 2 }}>
                                    <Text className="text-sm font-medium">
                                        {entry.previousAnnualCTC ? `${fmtRupees(entry.previousAnnualCTC)} → ` : ''}
                                        {fmtRupees(entry.annualCTC)}
                                        {pct && <span style={{ color: '#535862' }}>&nbsp;&nbsp;({pct})</span>}
                                    </Text>
                                    <Text className="text-xs" style={{ color: '#535862' }}>
                                        {subtitleParts.join(' · ')}
                                    </Text>
                                    {entry.arrears && (
                                        <Text className="text-xs" style={{ color: '#D97706' }}>
                                            Arrears: {fmtRupees(entry.arrears.amount)} paid with{' '}
                                            {entry.arrears.payoutMonth}/{entry.arrears.payoutYear} ({titleCase(entry.arrears.status)})
                                        </Text>
                                    )}
                                </Flex>
                                <Flex vertical align="flex-end" style={{ gap: 2 }}>
                                    <Text className="text-xs" style={{ color: '#94A3B8' }}>
                                        {dayjs(entry.createdAt).format('D/M/YYYY')}
                                    </Text>
                                    {/* An initial-hire entry (no previousAnnualCTC) has nothing to undo
                                    back to — the backend refuses it outright, so don't offer it here. */}
                                    {index === 0 && onUndoLatest && entry.previousAnnualCTC != null && (
                                        <Text
                                            className="text-xs"
                                            style={{ color: '#FF4F4F', cursor: 'pointer', opacity: undoLoading ? 0.5 : 1 }}
                                            onClick={() => !undoLoading && onUndoLatest()}
                                        >
                                            Undo
                                        </Text>
                                    )}
                                </Flex>
                            </Flex>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RevisionHistorySection;
