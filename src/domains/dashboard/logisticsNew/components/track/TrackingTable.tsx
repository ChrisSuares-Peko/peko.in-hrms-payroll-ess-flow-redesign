import React from 'react';

import { Flex } from 'antd';
import type { TableProps } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { Shipment } from '../../types/tracking';

interface TrackingTableProps {
    data: Shipment;
}

const TrackingTable: React.FC<TrackingTableProps> = ({ data }) => {
    const trackingData = [
        {
            key: data.id,
            orderId: data.corporateTxnId,
            totalWeight: data.weight,
            quantity: Number(data.items?.length),
            totalAmount: data.amount,
        },
    ];
    const columns: TableProps<{}>['columns'] = [
        {
            title: 'Order ID',
            dataIndex: 'orderId',
            key: 'orderId',
            render: orderId => <Flex className="text-sm">{orderId}</Flex>,
        },
        {
            title: 'Total Weight',
            dataIndex: 'totalWeight',
            key: 'totalWeight',
            render: totalWeight => <Flex className="text-sm">{totalWeight} Kg</Flex>,
        },
        {
            title: 'No. of Items',
            dataIndex: 'quantity',
            key: 'quantity',
            render: quantity => <Flex className="text-sm">{quantity}</Flex>,
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
        <GenericTable
            className="my-4"
            pagination={false}
            columns={columns}
            dataSource={trackingData}
        />
    );
};

export default TrackingTable;
