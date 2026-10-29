import { ClockCircleOutlined, ThunderboltFilled } from '@ant-design/icons';
import { Tag } from 'antd';

interface DeliveryTypeTagProps {
    deliveryType?: string;
    tatInDays?: number | string | null;
    className?: string;
}

// Maps the API's `deliveryType` (+ `tatInDays` for delayed vouchers) to the
// small pill shown on the details page. Renders nothing when deliveryType is
// absent/unknown rather than guessing — only shows what the data actually says.
const DeliveryTypeTag = ({ deliveryType, tatInDays, className }: DeliveryTypeTagProps) => {
    const type = deliveryType?.toLowerCase();
    if (type !== 'realtime' && type !== 'delayed') return null;

    if (type === 'realtime') {
        return (
            <Tag
                icon={<ThunderboltFilled />}
                className={`rounded-xl bg-green-50 px-3 py-1 text-xs font-medium border-green-500 text-green-600 ${className ?? ''}`}
            >
                Delivered instantly
            </Tag>
        );
    }

    const days = Number(tatInDays);
    const tatLabel = days > 0 ? `in ${days} day${days === 1 ? '' : 's'}` : 'with a delay';

    return (
        <Tag
            icon={<ClockCircleOutlined />}
            className={`rounded-xl bg-gray-100 px-3 py-1 text-xs font-medium border-gray-300 text-gray-600 ${className ?? ''}`}
        >
            Delivered {tatLabel}
        </Tag>
    );
};

export default DeliveryTypeTag;
