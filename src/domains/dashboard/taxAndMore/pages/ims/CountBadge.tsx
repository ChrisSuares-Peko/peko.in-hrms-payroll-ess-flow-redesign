import { STATUS_LABELS, getStatusBg, getStatusColor } from './imsUtils';
import { ImsInvoiceStatus } from '../../types';

const CountBadge = ({ count, status }: { count: number; status: ImsInvoiceStatus }) => (
    <span
        className="px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 text-[10px] sm:text-xs font-medium whitespace-nowrap"
        style={{
            backgroundColor: getStatusBg(status),
            color: getStatusColor(status),
            borderRadius: 60,
            lineHeight: '18px',
        }}
    >
        {count} {STATUS_LABELS[status]}
    </span>
);

export default CountBadge;
