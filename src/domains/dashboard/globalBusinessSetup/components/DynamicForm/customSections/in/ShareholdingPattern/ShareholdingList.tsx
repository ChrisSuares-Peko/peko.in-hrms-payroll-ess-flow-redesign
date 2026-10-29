import { InfoCircleOutlined } from '@ant-design/icons';

import ShareholderSection from './ShareholderSection';
import { useShareholderList } from './useShareholderList';
import { useShareholdingPattern } from './useShareholdingPattern';
import { CustomSectionRenderProps } from '../../types';

const CAPITAL_NOTES: Array<[string, string]> = [
    ['Authorized Capital', 'Maximum capital the company can raise'],
    ['Paid-up Capital', 'Actual capital invested by shareholders'],
    ['Face Value', 'Nominal value of each share'],
    ['Total shareholding must equal 100%', ''],
    ['Private Limited: 2–200 shareholders', 'Public Limited: min 7 | OPC: exactly 1'],
];

/**
 * Self-managed mode (no builder repeater): the component owns the whole
 * shareholder list — rows, add/remove, and its own edit modal — plus the
 * capital-structure info box. Read-side aggregates come from
 * useShareholdingPattern; instance mutations/seeding from useShareholderList.
 */
export default function ShareholdingList({
    section,
    instancePath,
    config,
}: CustomSectionRenderProps) {
    const ctrl = useShareholdingPattern(section, instancePath, config);
    const list = useShareholderList(section, instancePath);

    return (
        <div className="w-full space-y-6">
            <ShareholderSection ctrl={{ ...ctrl, ...list }} />

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                    <InfoCircleOutlined className="shrink-0 text-amber-500" />
                    <p className="text-sm font-semibold text-amber-700">
                        Understanding Capital Structure:
                    </p>
                </div>
                <ul className="space-y-1 pl-6">
                    {CAPITAL_NOTES.map(([label, desc]) => (
                        <li key={label} className="flex gap-1 text-sm text-amber-700">
                            <span className="shrink-0">•</span>
                            <span>
                                <span className="font-medium">{label}</span>
                                {desc && (
                                    <>
                                        <span>: </span>
                                        <span className="text-amber-600">{desc}</span>
                                    </>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
