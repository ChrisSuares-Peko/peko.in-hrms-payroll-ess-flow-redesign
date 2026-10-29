import React from 'react';

import { Flex, Typography } from 'antd';
import type { TableProps } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { Shipment, ReturnDetails } from '../../types/tracking';

interface TrackingTableProps {
    Shipmentdata: Shipment;
    Returndata: ReturnDetails;
}

const ReturnTable: React.FC<TrackingTableProps> = ({ Shipmentdata, Returndata }) => {
    const trackingData = [
        {
            key: Shipmentdata.id,
            corporateTxnId: Returndata.corporateTxnId,
            totalWeight: Shipmentdata.weight,
            quantity: Number(Shipmentdata.items?.length),
            totalAmount: Returndata.amount,
        },
    ];
    const columns: TableProps<{}>['columns'] = [
        {
            title: 'Order ID',
            dataIndex: 'corporateTxnId',
            key: 'corporateTxnId',
            render: orderId => <Flex className="text-sm">{orderId}</Flex>,
        },
        {
            title: 'Total Weight',
            dataIndex: 'totalWeight',
            key: 'totalWeight',
            render: totalWeight => <Flex className="text-sm">{totalWeight || 0} Kg</Flex>,
        },
        {
            title: 'No. of Items',
            dataIndex: 'quantity',
            key: 'quantity',
            render: quantity => <Flex className="text-sm">{quantity || ''}</Flex>,
        },
        {
            title: 'Total Amount',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: totalAmount => (
                <Flex className="text-sm">
                    ₹{formatNumberWithLocalString(parseFloat(totalAmount))}
                </Flex>
            ),
        },
    ];

    return (
        <Flex vertical className="w-full mb-3">
            <Typography.Text className="text-sm font-medium sm:text-lg">
                Return Details
            </Typography.Text>
            <GenericTable
                className="my-2"
                pagination={false}
                columns={columns}
                dataSource={trackingData}
            />
        </Flex>
    );
};

export default ReturnTable;
