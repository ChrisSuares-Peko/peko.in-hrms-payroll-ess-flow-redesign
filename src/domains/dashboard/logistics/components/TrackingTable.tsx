import React, { useState } from 'react';

import { Button, Flex, Table } from 'antd';
import type { TableProps } from 'antd';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import UpdateOrderModal from './UpdateOrderModal';
import { useUpdateShipmentApi } from '../hooks/useUpdateShipmentApi';
import { DataType } from '../types/index';
import { formalTextFormatter } from '../utils/helperFunctions';

const columns: TableProps<DataType>['columns'] = [
    {
        title: 'SENDER',
        dataIndex: 'shipper',
        key: 'shipper',
        render: shipper => (
            <Flex vertical>
                <Flex className="h-5 text-sm font-semibold">{shipper.Line1}</Flex>
                <Flex className="h-5 line-clamp-1">{shipper.City}</Flex>
                <Flex className="h-5 text-xs line-clamp-1">{shipper.Line2}</Flex>
                <Flex className="h-8 text-xs line-clamp-2">{shipper.Line3}</Flex>
            </Flex>
        ),
        width: '15%',
    },
    {
        title: 'RECEIVER ',
        dataIndex: 'receiver',
        key: 'receiver',
        render: receiver => (
            <Flex vertical>
                <Flex className="h-5 text-sm font-semibold">{receiver.Line1}</Flex>
                <Flex className="h-5 line-clamp-1">{receiver.City}</Flex>
                <Flex className="h-5 text-xs line-clamp-1">{receiver.Line2}</Flex>
                <Flex className="h-8 text-xs line-clamp-2">{receiver.Line3}</Flex>
            </Flex>
        ),
        width: '15%',
    },
    {
        title: 'TYPE ',
        dataIndex: 'type',
        key: 'type',
        render: type => <Flex className="text-sm text-neutral-600">{type}</Flex>,
        width: '15%',
    },
    {
        title: 'WEIGHT',
        dataIndex: 'weight',
        key: 'weight',
        render: weight => <Flex className="text-sm text-neutral-600">{weight}</Flex>,
        width: '10%',
    },
    {
        title: 'SERVICE TYPE ',
        dataIndex: 'serviceType',
        key: 'type',
        render: type => (
            <Flex className="text-sm text-neutral-600">{formalTextFormatter(type)}</Flex>
        ),
        width: '15%',
    },
    {
        title: 'TOTAL AMOUNT ',
        dataIndex: 'totalAmount',
        key: 'totalAmount',
        render: totalAmount => (
            <Flex className="text-sm text-neutral-600">₹ {parseFloat(totalAmount).toFixed(2)}</Flex>
        ),
        width: '15%',
    },
    {
        title: 'ACTION',
        key: 'action',
        render: (_, record) => (
            <Flex vertical gap={10}>
                {(record.status === 'HUBCHECKIN' || record.status === 'PICKUP') && (
                    <Button
                        className="text-sm text-red-500"
                        danger
                        onClick={() => record.handleUpdateModal(record)}
                    >
                        Update Order
                    </Button>
                )}
                {record.status === 'PENDING' && (
                    <Button
                        className="text-sm text-red-500 "
                        danger
                        onClick={() =>
                            record.handleModalTrigger(
                                true,
                                'Are you sure you want to cancel your order?',
                                'CANCEL'
                            )
                        }
                    >
                        Cancel Order
                    </Button>
                )}
                {record.status === 'DELIVERED' && (
                    <Button
                        className="text-sm text-red-500 "
                        danger
                        onClick={() =>
                            record.handleModalTrigger(
                                true,
                                'Are you sure you want to return your order?',
                                'RETURN'
                            )
                        }
                    >
                        Return Order
                    </Button>
                )}
            </Flex>
        ),
        width: '20%',
    },
];

interface TrackingTableProps {
    data: string;
    amount: string;
    status: string;
    handleChangeStatus: (value: boolean) => void;
    orderId: string;
}

const TrackingTable: React.FC<TrackingTableProps> = ({
    data,
    amount,
    status,
    handleChangeStatus,
    orderId,
}) => {
    const trackingTableData = JSON.parse(data);
    const { handleUpdateShipmentStatus, isLoading } = useUpdateShipmentApi();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdateModelOpen, setUpdateModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalTriggerFor, setModalTriggerFor] = useState('');

    const OnTriggerChangeStatus = (orderChangingStatus: string) => {
        handleUpdateShipmentStatus({ orderId, updateType: orderChangingStatus }).then(result => {
            if (result) {
                handleChangeStatus(true);
            }
            setIsModalOpen(false);
        });
    };

    const handleModalTrigger = (isOpen: boolean, title: string, triggerFor: string) => {
        setIsModalOpen(isOpen);
        setModalTitle(title);
        setModalTriggerFor(triggerFor);
    };

    const handleUpdateModal = () => {
        setUpdateModalOpen(true);
    };

    const trackingData: DataType[] = [
        {
            key: trackingTableData.merchant_orderid,
            trackingNo: trackingTableData.merchant_orderid,
            shipper: {
                Line1: trackingTableData.senderAddress.Line1,
                City: trackingTableData.senderAddress.City,
                Line2: trackingTableData.senderAddress.Line2,
                Line3: trackingTableData.senderAddress.Line3,
            },
            receiver: {
                Line1: trackingTableData.customerName,
                City: trackingTableData.customerCity,
                Line2: trackingTableData.customerAddress,
                Line3: trackingTableData.customerMobileNo,
            },
            type: trackingTableData.orderCategory,
            serviceType: trackingTableData.serviceType,
            weight: trackingTableData.orderWeight,
            totalAmount: amount,
            status,
            OnTriggerChangeStatus,
            isLoading,
            handleModalTrigger,
            handleUpdateModal,
        },
    ];

    return (
        <>
            <Table
                style={{ overflow: 'auto' }}
                className="my-8"
                pagination={false}
                columns={columns}
                dataSource={trackingData}
                loading={isLoading}
            />
            <ConfirmationModal
                isOpen={isModalOpen}
                title={modalTitle}
                isLoading={isLoading}
                handleSubmit={() => OnTriggerChangeStatus(modalTriggerFor)}
                handleCancel={() => setIsModalOpen(false)}
            />
            {isUpdateModelOpen && (
                <UpdateOrderModal
                    data={trackingTableData}
                    orderId={orderId}
                    open={isUpdateModelOpen}
                    handleCancel={() => setUpdateModalOpen(false)}
                />
            )}
        </>
    );
};

export default TrackingTable;
