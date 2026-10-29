import type { FC } from 'react';

import { Badge } from 'antd';

import { findColorByStatus } from '../utils/data';

interface StatusBadgeProps {
    status: string;
}

const StatusBadge: FC<StatusBadgeProps> = ({ status }) => {
    const colors = findColorByStatus(status);
    function formatStatus(statusText?: string): string {
        if (!statusText) return '';
        return statusText
            .toLowerCase()
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    return (
        <Badge
            status={colors.badgeStatus}
            text={formatStatus(status)}
            className="px-2 rounded-2xl"
            style={{
                color: colors.text,
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`,
                padding: '1px 9px',
                borderRadius: '15px',
            }}
        />
    );
};
export default StatusBadge;
