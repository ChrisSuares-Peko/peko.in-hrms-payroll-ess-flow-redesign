import { Badge } from 'antd';

import { ChallanOrderStatus } from '../types/index';

// Order status pills per the Order History design.
const statusStyles: Record<ChallanOrderStatus, { text: string; background: string; dot: string }> =
    {
        Assigned: { text: '#1570EF', background: '#EFF8FF', dot: '#2E90FA' },
        Processing: { text: '#B78912', background: '#FFF8EB', dot: '#F79009' },
        'Challan Partially Resolved': { text: '#B78912', background: '#FFF8EB', dot: '#F79009' },
        'Challan Completely Resolved': { text: '#027A48', background: '#ECFDF3', dot: '#12B76A' },
        'Partially Refunded': { text: '#B42318', background: '#FEF3F2', dot: '#F04438' },
        'Completely Refunded': { text: '#475569', background: '#F1F5F9', dot: '#667085' },
        Failed: { text: '#B42318', background: '#FEF3F2', dot: '#F04438' },
    };

interface Props {
    status: ChallanOrderStatus;
}

const ChallanOrderStatusBadge = ({ status }: Props) => {
    const style = statusStyles[status] ?? statusStyles.Processing;
    return (
        <Badge
            color={style.dot}
            text={status}
            style={{
                color: style.text,
                backgroundColor: style.background,
                padding: '2px 10px',
                borderRadius: '30px',
                fontWeight: 500,
                fontSize: '13px',
            }}
        />
    );
};

export default ChallanOrderStatusBadge;
