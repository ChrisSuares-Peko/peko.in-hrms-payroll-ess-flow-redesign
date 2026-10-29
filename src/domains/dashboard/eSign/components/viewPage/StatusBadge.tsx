import type { FC } from 'react';

import { Badge } from 'antd';

interface StatusBadgeProps {
    status: string;
}

const StatusBadge: FC<StatusBadgeProps> = ({ status }) => {
    if (status === 'PENDING') {
        return (
            <Badge
                status="warning"
                text="Pending"
                className="px-2 rounded-2xl text-nowrap"
                style={{ color: '#FAAD14', fontSize: '0.838rem' }}
            />
        );
    }
    if (status === 'COMPLETED') {
        return (
            <Badge
                status="success"
                text="Signed"
                className="px-2 rounded-2xl text-nowrap"
                style={{ color: '#027A48', fontSize: '0.838rem' }}
            />
        );
    }
    if (status === 'DECLINED' || status === 'REJECTED') {
        return (
            <Badge
                status="error"
                text="Rejected"
                className="px-2 rounded-2xl text-nowrap"
                style={{ color: '#FF4D4F', fontSize: '0.838rem' }}
            />
        );
    }
    return <Badge status="default" text={status} className="px-2 rounded-2xl" />;
};
export default StatusBadge;
