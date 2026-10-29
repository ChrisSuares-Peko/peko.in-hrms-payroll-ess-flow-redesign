import { ReactNode } from 'react';

import {
    CheckCircleFilled,
    ClockCircleFilled,
    TeamOutlined,
    UserAddOutlined,
} from '@ant-design/icons';
import { Typography } from 'antd';

import { KYB_STATUS_META } from './statusMeta';
import { ApplicationsSummary, KybStatus } from '../../types/corporateCardApplications';

const { Text } = Typography;

interface TileConfig {
    key: string;
    label: string;
    caption: string;
    value: number;
    bg: string;
    accent: string;
    icon: ReactNode;
    /** Set when the tile filters the table on click. */
    status?: KybStatus;
}

interface Props {
    summary: ApplicationsSummary | null;
    loading: boolean;
    activeStatus: KybStatus | '';
    onSelectStatus: (status: KybStatus | '') => void;
}

/** Overview funnel above the applications table: total corporates → provisioning status breakdown.
 *  The three status tiles double as table filters (click to filter, click the active one to clear). */
const OverviewCards = ({ summary, loading, activeStatus, onSelectStatus }: Props) => {
    const s = summary;
    const tiles: TileConfig[] = [
        {
            key: 'totalCorporates',
            label: 'Total Corporates',
            caption: 'In the system',
            value: s?.totalCorporates ?? 0,
            bg: '#F6EBF4',
            accent: '#9333EA',
            icon: <TeamOutlined />,
        },
        {
            key: 'notProvisioned',
            label: 'Not Provisioned',
            caption: 'No application yet',
            value: s?.notProvisioned ?? 0,
            bg: '#F2F4F7',
            accent: '#475569',
            icon: <UserAddOutlined />,
        },
        {
            key: 'pending',
            label: 'Pending',
            caption: 'Awaiting setup',
            value: s?.pending ?? 0,
            bg: KYB_STATUS_META.PENDING.bg,
            accent: KYB_STATUS_META.PENDING.color,
            icon: <ClockCircleFilled />,
            status: 'PENDING',
        },
        {
            key: 'completed',
            label: 'Completed',
            caption: 'Ready to use',
            value: s?.completed ?? 0,
            bg: KYB_STATUS_META.COMPLETED.bg,
            accent: KYB_STATUS_META.COMPLETED.color,
            icon: <CheckCircleFilled />,
            status: 'COMPLETED',
        },
    ];

    if (loading && !summary) {
        return (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {tiles.map(t => (
                    <div key={t.key} className="h-[104px] animate-pulse rounded-2xl bg-[#F2F4F7]" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {tiles.map(tile => {
                const isClickable = Boolean(tile.status);
                const isActive = isClickable && activeStatus === tile.status;
                const content = (
                    <>
                        <span
                            className="flex size-9 items-center justify-center rounded-full bg-white text-base"
                            style={{ color: tile.accent }}
                        >
                            {tile.icon}
                        </span>
                        <div className="flex flex-col gap-0.5">
                            <Text className="text-sm leading-snug text-textBody">{tile.label}</Text>
                            <Text className="text-xl font-semibold leading-tight text-textHeadings xl:text-2xl">
                                {tile.value}
                            </Text>
                            <Text className="text-xs text-textGreyLight">{tile.caption}</Text>
                        </div>
                    </>
                );

                if (!isClickable) {
                    return (
                        <div
                            key={tile.key}
                            className="flex flex-col gap-2.5 rounded-2xl px-5 py-4"
                            style={{ backgroundColor: tile.bg }}
                        >
                            {content}
                        </div>
                    );
                }

                return (
                    <button
                        key={tile.key}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onSelectStatus(isActive ? '' : (tile.status as KybStatus))}
                        className="flex flex-col gap-2.5 rounded-2xl px-5 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                        style={{
                            backgroundColor: tile.bg,
                            boxShadow: isActive ? `0 0 0 2px ${tile.accent}` : undefined,
                        }}
                    >
                        {content}
                    </button>
                );
            })}
        </div>
    );
};

export default OverviewCards;
