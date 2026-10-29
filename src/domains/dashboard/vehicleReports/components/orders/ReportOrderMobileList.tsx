import { Empty, Flex, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import OrderActionButtons from './OrderActionButtons';
import { ReportOrderDetail } from '../../types/index';
import ReportOrderStatusBadge from '../shared/ReportOrderStatusBadge';

const { Text } = Typography;

interface Props {
    rows: ReportOrderDetail[];
    isLoading: boolean;
    onView: (order: ReportOrderDetail) => void;
    onDownload: (order: ReportOrderDetail) => void;
}

// Card list that replaces the order table below `sm`. The design has no mobile
// frames, so this follows the MobileTable idiom already used across Turbo.
const ReportOrderMobileList = ({ rows, isLoading, onView, onDownload }: Props) => {
    if (isLoading) return <Skeleton active paragraph={{ rows: 6 }} />;
    if (!rows.length) return <Empty description="No report orders yet" />;

    return (
        <Flex vertical gap={12}>
            {rows.map(order => (
                <Flex
                    key={order.orderId}
                    vertical
                    gap={10}
                    className="rounded-xl bg-white p-4 shadow-[0px_2px_20px_rgba(0,0,0,0.04)]"
                >
                    <Flex align="start" justify="space-between" gap={10}>
                        <Flex vertical>
                            <Text className="text-sm font-medium text-[#0A0A0A]">
                                {order.reportName}
                            </Text>
                            <Text className="text-xs text-[#98A2B3]">
                                {`${order.vehicleNumber} · ${order.vehicleModel}`}
                            </Text>
                        </Flex>
                        <ReportOrderStatusBadge status={order.status} />
                    </Flex>

                    <Flex align="center" justify="space-between" gap={10}>
                        <Flex vertical>
                            <Text className="text-xs text-[#98A2B3]">{order.orderId}</Text>
                            <Text className="text-xs text-[#98A2B3]">
                                {dayjs(order.orderDate).format('DD MMM YYYY')}
                            </Text>
                        </Flex>
                        <Text className="text-sm font-medium text-[#0A0A0A]">
                            {`₹ ${formatNumberWithLocalString(order.amount)}`}
                        </Text>
                    </Flex>

                    <OrderActionButtons
                        canDownload={order.status === 'Ready'}
                        onView={() => onView(order)}
                        onDownload={() => onDownload(order)}
                    />
                </Flex>
            ))}
        </Flex>
    );
};

export default ReportOrderMobileList;
