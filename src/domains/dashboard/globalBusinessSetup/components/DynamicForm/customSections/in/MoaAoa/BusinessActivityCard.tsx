import { Fragment } from 'react';

import { Activity } from './resolve';

type BusinessActivityCardProps = {
    activity: Activity;
};

export default function BusinessActivityCard({ activity }: BusinessActivityCardProps) {
    const rows: Array<[string, string | undefined]> = [
        ['Section', activity.section],
        ['Division', activity.division],
        ['Group', activity.group],
        ['Class', activity.nic_class],
    ];
    const breakdown = rows.filter(([, value]) => value);

    return (
        <div className="rounded-xl border border-green-200 bg-green-50/40 p-4">
            <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-green-500 text-[11px] font-medium text-green-600">
                    1
                </span>
                <p className="text-sm font-medium text-green-700">Business Activities</p>
            </div>
            <p className="mt-3 text-sm font-medium text-gray-700">Primary Activity (NIC Code):</p>
            <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-base font-semibold text-gray-800">{activity.code} -</p>
                {breakdown.length > 0 && (
                    <div className="mt-1 space-y-0.5 text-xs text-gray-500 grid grid-cols-[auto_1fr] gap-x-3">
                        {breakdown.map(([label, value]) => (
                            <Fragment key={label}>
                                <span>{label}:</span>
                                <span> {value}</span>
                            </Fragment>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
