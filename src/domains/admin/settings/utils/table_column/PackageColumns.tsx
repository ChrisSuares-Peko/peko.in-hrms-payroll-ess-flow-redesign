import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import PriceAfterDiscount from '@components/atomic/PriceAfterDiscount';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import { Packages } from '../../types/package';

interface ColumnsProps {
    handleActive: (packageId: number | string, isActive: any) => void;
    handleEdit: (record: Packages) => void;
    handleConfirmation: (record: Packages) => void;
    accessPermission: any;
}

const getPackageColumns = ({
    handleActive,
    handleEdit,
    handleConfirmation,
    accessPermission,
}: ColumnsProps): ColumnsType<Packages> => [
    {
        title: 'Date',
        dataIndex: 'createdAt',
        sorter: true,
        key: 'createdAt',
        render: (createdAt: any) => (
            <Flex vertical>
                <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Package Name',
        sorter: true,
        dataIndex: 'packageName',
        key: 'packageName',
    },
    {
        title: 'Partner Name',
        sorter: true,
        dataIndex: 'partnerName',
        key: 'partnerName',
        render: partnerName => partnerName || 'N/A',
    },
    {
        title: 'Monthly Price',
        dataIndex: ['packagePrices', 'monthly'],
        key: 'packagePrices.monthly',
        render: (_: any, data: any) => (
            <PriceAfterDiscount
                price={data?.packagePrices?.monthly}
                discount={data?.discount?.monthly}
            />
        ),
    },
    {
        title: <Tooltip title="Lower values stands for higher priorities">Priority Level</Tooltip>,
        dataIndex: 'priorityLevel',
        key: 'priorityLevel',
        sorter: true,
        render: priorityLevel => priorityLevel || 'N/A',
    },
    // {
    //     title: 'Description',
    //     dataIndex: 'description',
    //     key: 'description',
    //     width:'25%',
    // },
    {
        title: 'Status',
        dataIndex: 'status',
        sorter: true,
        key: 'status',
        render: (isActive: any, record: Packages) => (
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
        key: 'id',
        render: (_: any, record: Packages) => (
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
        key: 'id',
        render: (_: any, record: Packages) => (
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
                        <DeleteOutlined
                            className="text-brandColor"
                            onClick={() => handleConfirmation(record)}
                        />
                    )}
                </span>
            </Tooltip>
        ),
    },
];

export default getPackageColumns;
