import { InfoCircleOutlined } from '@ant-design/icons';

import { useShareholdingPattern } from './useShareholdingPattern';
import { CustomSectionRenderProps } from '../../types';

/**
 * RepeaterFooter for a repeater-enabled shareholding section. Always mounted
 * below the repeater summary (SectionRenderer), it shows the capital allocation
 * totals and — via useShareholdingPattern's effect — keeps the cross-instance
 * `shareholders_valid` sentinel up to date. The per-instance form only mounts
 * while the item modal is open, so this footer owns the sentinel sync.
 *
 * Receives `instancePath = pages.{pageId}.{sectionId}.0`; the hook strips the
 * trailing `.0` to read all instances from the section path.
 */
export default function ShareholdingSummary({
    section,
    instancePath,
    config,
}: CustomSectionRenderProps) {
    const ctrl = useShareholdingPattern(section, instancePath, config);
    const { paidUpShares, totalSharesAllotted, remainingShares, shareholdersValid } = ctrl;
    const sentinelError = ctrl.error('shareholders_valid');

    if (!paidUpShares) {
        return (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <InfoCircleOutlined className="shrink-0 text-amber-500" />
                <p className="text-xs text-amber-700">
                    Paid-up capital and face value must be filled before allotting shares.
                </p>
            </div>
        );
    }

    const stats = [
        { label: 'Paid-up Shares', value: paidUpShares },
        { label: 'Shares Allotted', value: totalSharesAllotted },
        { label: 'Remaining', value: remainingShares ?? 0 },
    ];

    return (
        <div className="mt-4 space-y-2">
            <div className="grid grid-cols-3 divide-x divide-gray-100 rounded-xl border border-gray-200">
                {stats.map(stat => (
                    <div key={stat.label} className="p-3 text-center">
                        <p className="text-xs text-gray-400">{stat.label}</p>
                        <p
                            className={`text-sm font-medium ${
                                stat.label === 'Remaining' && !shareholdersValid
                                    ? 'text-red-500'
                                    : 'text-gray-800'
                            }`}
                        >
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>
            {sentinelError && !shareholdersValid && (
                <p className="text-xs text-red-500">
                    Total shareholding must equal 100% and every shareholder must hold at least 1
                    share.
                </p>
            )}
        </div>
    );
}
