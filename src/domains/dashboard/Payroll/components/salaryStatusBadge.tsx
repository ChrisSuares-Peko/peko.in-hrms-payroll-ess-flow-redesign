import React from 'react';

import { Badge } from 'antd';
import { BadgeProps } from 'antd/lib/badge'; // Import the BadgeProps type from antd

interface SalaryStatusBadgeProps {
    status: string;
    // Only meaningful for PARTIALLY_PAID — how many employees are still pending, shown as
    // "Partially Paid · N pending" (e.g. a late-added employee back-filled into an
    // already-approved/paid month, everyone else already settled).
    pendingCount?: number;
}

const SalaryStatusBadge: React.FC<SalaryStatusBadgeProps> = ({ status, pendingCount }) => {
    const getBadgeProps = (status2: string): BadgeProps & { text: string } => {
        switch (status2) {
            case 'PAID':
                return {
                    status: 'success',
                    text: 'Paid',
                    className: 'px-2 rounded-2xl',
                    style: { backgroundColor: '#ECFDF3', color: '#027A48' },
                };
            case 'PARTIALLY_PAID':
                return {
                    status: 'warning',
                    text: `Partially Paid${pendingCount != null ? ` · ${pendingCount} pending` : ''}`,
                    className: 'm-1',
                    style: {
                        backgroundColor: '#FFF6EA',
                        color: '#FFA940',
                        padding: '4px 10px',
                        borderRadius: 10,
                    },
                };
            case 'PENDING':
                return {
                    status: 'error',
                    text: 'Pending',
                    className: 'px-2 rounded-2xl',
                    style: { backgroundColor: '#FFF2EA', color: '#F15046' },
                };
            case 'APPROVED':
                return {
                    status: 'success',
                    text: 'Approved',
                    className: 'px-2 rounded-2xl',
                    style: { backgroundColor: '#ECFDF3', color: '#027A48' },
                };
            case 'FAILD':
                return {
                    status: 'error',
                    text: 'Pending',
                    className: 'px-2 rounded-2xl',
                    style: { backgroundColor: '#FFF2EA', color: '#F15046' },
                };
            case 'UPCOMING':
                return {
                    status: 'warning',
                    text: 'Upcoming',
                    className: 'rounded-2xl',
                    style: {
                        color: '#FAAD14',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '12px',
                        padding: '0 4px',
                    },
                };
            default:
                return {
                    status: 'default',
                    text: status2,
                    className: 'px-2 rounded-2xl',
                };
        }
    };

    const { status: badgeStatus, text, className, style } = getBadgeProps(status);

    return <Badge status={badgeStatus} text={text} className={className} style={style} />;
};

export default SalaryStatusBadge;
