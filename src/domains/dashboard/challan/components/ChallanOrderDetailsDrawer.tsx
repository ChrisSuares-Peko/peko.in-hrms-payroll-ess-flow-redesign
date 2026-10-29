import { ReactNode } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Drawer, Flex, Spin, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import ChallanOrderStatusBadge from './ChallanOrderStatusBadge';
import { ChallanOrder } from '../types/index';

const { Text, Title } = Typography;

interface Props {
    open: boolean;
    order: ChallanOrder | null;
    loading?: boolean;
    onClose: () => void;
}

const Row = ({ label, value }: { label: string; value: ReactNode }) => (
    <Flex justify="space-between" align="center" className="border-b border-[#EFF1F4] py-3">
        <Text className="text-sm text-[#667085]">{label}</Text>
        <Text className="text-sm font-medium text-[#1E293B]">{value}</Text>
    </Flex>
);

const ChallanOrderDetailsDrawer = ({ open, order, loading, onClose }: Props) => (
    <Drawer
        open={open}
        onClose={onClose}
        width={460}
        title={
            <Title level={5} className="!mb-0">
                Order Details
            </Title>
        }
    >
        {order && (
            <Flex vertical>
                <Row label="Order ID" value={order.orderId} />
                <Row label="Order Date" value={(order.orderDate || '').split(' ')[0]} />
                <Row label="Amount" value={`₹ ${formatNumberWithLocalString(order.amount)}`} />
                <Row label="Status" value={<ChallanOrderStatusBadge status={order.status} />} />

                {loading && (
                    <Flex align="center" justify="center" className="mt-6">
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 22 }} spin />} />
                    </Flex>
                )}

                {!loading && order.challans && order.challans.length > 0 && (
                    <Flex vertical gap={10} className="mt-5">
                        <Text className="text-sm font-medium text-[#1E293B]">Challans</Text>
                        {order.challans.map(c => (
                            <Flex
                                key={c.challan_number}
                                justify="space-between"
                                align="center"
                                className="rounded-xl border border-[#EFF1F4] p-3"
                            >
                                <Flex vertical className="min-w-0">
                                    <Text className="text-sm text-[#42526D] break-all">
                                        {c.challan_number}
                                    </Text>
                                    {c.challan_status && (
                                        <Text className="text-xs text-[#868686]">
                                            {c.challan_status}
                                        </Text>
                                    )}
                                </Flex>
                                <Text className="text-sm text-[#42526D] whitespace-nowrap shrink-0 pl-3">
                                    ₹ {formatNumberWithLocalString(c.challan_price ?? c.amount)}
                                </Text>
                            </Flex>
                        ))}
                    </Flex>
                )}
            </Flex>
        )}
    </Drawer>
);

export default ChallanOrderDetailsDrawer;
