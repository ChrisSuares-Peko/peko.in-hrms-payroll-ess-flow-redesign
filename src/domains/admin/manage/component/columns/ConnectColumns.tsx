import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import { ConnectBody } from '../../types/connect';

interface ColumnsProps {
    handleActive: (connectId: number | string | undefined, isActive: any) => void;
    handleEdit: (record: ConnectBody) => void;
    handleConfirmation: (record: ConnectBody) => void;
    accessPermission: any;
}

const getConnectColumns = ({
    handleActive,
    handleEdit,
    handleConfirmation,
    accessPermission,
}: ColumnsProps): ColumnsType<ConnectBody> => [
    {
        title: 'Date',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        render: (createdAt: any) => (
            <Flex vertical>
                <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Service Provider',
        dataIndex: 'serviceProvider',
        sorter: true,
        key: 'serviceProvider',
    },
    {
        title: 'Address',
        sorter: true,
        dataIndex: 'address',
        key: 'address',
    },
    {
        title: 'Category',
        sorter: true,
        dataIndex: 'category',
        key: 'category',
    },
    {
        title: 'Description',
        sorter: true,
        dataIndex: 'description',
        key: 'description',
        width: '40%',
    },
    {
        title: 'Status',
        sorter: true,
        dataIndex: 'status',
        key: 'status',
        render: (isActive: any, record: ConnectBody) => (
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
        render: (_: any, record: ConnectBody) => (
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
        render: (_: any, record: ConnectBody) => (
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

export default getConnectColumns;
