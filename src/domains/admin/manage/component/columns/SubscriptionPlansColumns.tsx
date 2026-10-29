import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { SubscriptionPlan } from '../../types/subscriptionPlans';

interface ColumnsProps {
    handleActive: (SubscriptionId: number | string, isActive: any) => void;
    handleEdit: (record: SubscriptionPlan) => void;
    handleConfirmation: (record: SubscriptionPlan) => void;
    accessPermission: any;
}

const getSubscriptionPlansColumns = ({
    handleActive,
    handleEdit,
    handleConfirmation,
    accessPermission,
}: ColumnsProps): ColumnsType<SubscriptionPlan> => [
    {
        title: 'Date',
        sorter: true,
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (createdAt: any) => (
            <Flex vertical>
                <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Plan Name',
        sorter: true,
        dataIndex: 'name',
        key: 'name',
    },
    {
        title: 'Software Name',
        sorter: true,
        dataIndex: ['software', 'name'],
        key: 'software',
        render: name => name,
    },
    {
        title: 'Vendor Price',
        sorter: true,
        dataIndex: 'vendorPrice',
        key: 'vendorPrice',
        render: (vendorPrice: string) => `₹ ${formatNumberWithLocalString(vendorPrice)}`,
    },
    {
        title: 'Customer Price',
        sorter: true,
        dataIndex: 'price',
        key: 'price',
        render: (price: string) => `₹ ${formatNumberWithLocalString(price)}`,
    },
    {
        title: 'Validity',
        sorter: true,
        dataIndex: 'validity',
        key: 'validity',
    },
    {
        title: 'No of users',
        sorter: true,
        dataIndex: 'noOfUsers',
        key: 'noOfUsers',
        className: 'text-center',
    },
    {
        title: 'Status',
        sorter: true,
        dataIndex: 'status',
        key: 'status',
        render: (isActive: any, record: SubscriptionPlan) => (
            <Tooltip
                placement="top"
                title={
                    !accessPermission?.update
                        ? 'Sorry, you do not have permission to perform this action'
                        : ''
                }
            >
                <span>
                    {isActive === 1 || isActive === true ? (
                        <CheckOutlined
                            className={`cursor-pointer ${
                                accessPermission?.update ? 'text-textLime' : 'text-gray-400'
                            }`}
                            style={{ cursor: accessPermission?.update ? 'pointer' : 'not-allowed' }}
                            onClick={() =>
                                accessPermission?.update && handleActive(record.id, record.status)
                            }
                            disabled={!accessPermission?.update}
                        />
                    ) : (
                        <CloseOutlined
                            className={`cursor-pointer ${
                                accessPermission?.update ? 'text-brandColor' : 'text-gray-400'
                            }`}
                            style={{ cursor: accessPermission?.update ? 'pointer' : 'not-allowed' }}
                            onClick={() =>
                                accessPermission?.update && handleActive(record.id, record.status)
                            }
                            disabled={!accessPermission?.update}
                        />
                    )}
                </span>
            </Tooltip>
        ),
    },
    {
        title: 'Edit',
        dataIndex: 'action',
        key: 'edit',
        render: (_: any, record: SubscriptionPlan) => (
            <Tooltip
                placement="top"
                title={
                    !accessPermission?.update
                        ? 'Sorry, you do not have permission to perform this action'
                        : ''
                }
            >
                <span>
                    {!accessPermission?.update ? (
                        <EditOutlined style={{ color: 'gray', cursor: 'not-allowed' }} disabled />
                    ) : (
                        <EditOutlined onClick={() => handleEdit(record)} />
                    )}
                </span>
            </Tooltip>
        ),
    },
    {
        title: 'Delete',
        dataIndex: 'action',
        key: 'delete',
        render: (_: any, record: SubscriptionPlan) => (
            <Tooltip
                placement="top"
                title={
                    !accessPermission?.update
                        ? 'Sorry, you do not have permission to perform this action'
                        : ''
                }
            >
                <span>
                    {!accessPermission?.update ? (
                        <DeleteOutlined style={{ color: 'gray', cursor: 'not-allowed' }} disabled />
                    ) : (
                        <DeleteOutlined onClick={() => handleConfirmation(record)} />
                    )}
                </span>
            </Tooltip>
        ),
    },
];

export default getSubscriptionPlansColumns;
