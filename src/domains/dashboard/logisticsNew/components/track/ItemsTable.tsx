import React from 'react';

import { Flex, Typography } from 'antd';
import type { TableProps } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { Item } from '../../types/tracking';

interface TrackingTableProps {
    data: Item[];
}

const ItemsTable: React.FC<TrackingTableProps> = ({ data }) => {
    const trackingData = data.map((item, index) => ({
        key: `${item.name}-${index}`,
        itemName: item.name,
        quantity: item.quantity,
        price: item.price,
    }));
    const columns: TableProps<{}>['columns'] = [
        {
            title: 'Item Content',
            dataIndex: 'itemName',
            key: 'itemName',
            render: itemName => <Flex className="text-sm">{itemName}</Flex>,
        },
        {
            title: 'Item Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            render: quantity => <Flex className="text-sm">{quantity}</Flex>,
        },
        {
            title: 'Declared Item Value',
            dataIndex: 'price',
            key: 'price',
            render: price => (
                <Flex className="text-sm">₹{formatNumberWithLocalString(price)}</Flex>
            ),
        },
    ];

    return (
        <Flex vertical className="w-full mb-3">
            <Typography.Text className="text-sm font-medium sm:text-lg">
                Item Details
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

export default ItemsTable;
