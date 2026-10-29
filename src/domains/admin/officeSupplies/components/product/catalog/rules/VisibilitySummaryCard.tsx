import type { FC } from 'react';

import { HistoryOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import RuleSection from './RuleSection';
import { timeAgo } from './ruleUtils';
import { CatalogRulesSummary } from '../../../../types/ondcCatalogRules';

const Stat: FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="flex items-baseline gap-2">
        <span className="text-[22px] font-semibold leading-none text-[#101828]">{value}</span>
        <span className="text-[12px] text-[#667085]">{label}</span>
    </div>
);

const VisibilitySummaryCard: FC<{ summary: CatalogRulesSummary; onHistory: () => void }> = ({
    summary,
    onHistory,
}) => (
    <RuleSection
        title="Catalog visibility rules"
        description="Rules run top to bottom and each product is counted under the first one it fails. Only products without a usable image are not stored (last 24 hours); everything else is kept and hidden."
        extra={
            <>
                <span className="text-[12px] text-[#667085]">
                    {summary.lastAppliedAt
                        ? `Last changed ${timeAgo(summary.lastAppliedAt)}`
                        : 'No rule changes yet'}
                </span>
                <Button size="small" icon={<HistoryOutlined />} onClick={onHistory}>
                    History
                </Button>
            </>
        }
    >
        <div className="flex flex-wrap gap-x-8 gap-y-3">
            <Stat value={summary.synced} label="received from ONDC" />
            <Stat value={summary.visible} label="visible on the storefront" />
            <Stat value={summary.hidden} label="hidden or not stored" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg bg-[#F9FAFB] px-4 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">
                Hidden by
            </span>
            {summary.hiddenBy.map(item => (
                <span
                    key={item.key}
                    className={`text-[12px] ${item.count ? 'text-[#344054]' : 'text-[#98A2B3]'}`}
                >
                    {item.label}
                    <span className={`ml-1.5 font-semibold ${item.count ? 'text-[#101828]' : ''}`}>
                        {item.count}
                    </span>
                </span>
            ))}
        </div>
    </RuleSection>
);

export default VisibilitySummaryCard;
