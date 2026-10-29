import { Badge } from 'antd';

import { ChallanStatus } from '../types/index';

// Status pill colours per Figma (node 1535:20891 etc).
const statusStyles: Record<ChallanStatus, { text: string; background: string; dot: string }> = {
    Pending: { text: '#B78912', background: '#FFF8EB', dot: '#F79009' },
    Paid: { text: '#027A48', background: '#ECFDF3', dot: '#12B76A' },
    Disposed: { text: '#475569', background: '#F1F5F9', dot: '#667085' },
};

interface Props {
    status: ChallanStatus;
}

const ChallanStatusBadge = ({ status }: Props) => {
    const style = statusStyles[status] ?? statusStyles.Pending;
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
                fontSize: '14px',
            }}
        />
    );
};

export default ChallanStatusBadge;
