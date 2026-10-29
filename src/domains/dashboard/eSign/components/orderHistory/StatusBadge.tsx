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
                text="In Progress"
                className="px-2 rounded-2xl "
                style={{ color: '#FAAD14', fontSize: '0.838rem', padding: '0px' }}
            />
        );
    }
    if (status === 'COMPLETED') {
        return (
            <Badge
                status="success"
                text="Completed"
                className="px-2 rounded-2xl "
                style={{ color: '#027A48', fontSize: '0.838rem', padding: '0px' }}
            />
        );
    }
    if (status === 'REJECTED') {
        return (
            <Badge
                status="error"
                text="Rejected"
                className="px-2 rounded-2xl "
                style={{ color: '#FF4D4F', fontSize: '0.838rem', padding: '0px' }}
            />
        );
    }
    return <Badge status="default" text={status} className="px-2 rounded-2xl " />;
};
export default StatusBadge;
