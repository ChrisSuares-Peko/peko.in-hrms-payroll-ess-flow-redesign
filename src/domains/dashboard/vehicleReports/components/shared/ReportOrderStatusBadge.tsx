import { Badge } from 'antd';

import { ReportStatus } from '../../types/index';
import { reportStatusLabels, reportStatusStyles } from '../../utils/data';

interface Props {
    status: ReportStatus;
}

// Status pill for report orders. Same shape as the challan order badge so the two
// Droom services read consistently.
const ReportOrderStatusBadge = ({ status }: Props) => {
    const style = reportStatusStyles[status] ?? reportStatusStyles.Building;
    return (
        <Badge
            color={style.dot}
            text={reportStatusLabels[status] ?? status}
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

export default ReportOrderStatusBadge;
