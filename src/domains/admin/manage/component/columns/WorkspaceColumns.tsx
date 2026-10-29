import {
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import { Flex, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { WorkspaceBody } from '../../types/workspace';

interface ColumnsProps {
    handleActive: (connectId: number | string, isActive: any) => void;
    handleEdit: (record: WorkspaceBody) => void;
    handleConfirmation: (record: WorkspaceBody) => void;
    accessPermission: any;
}

const getWorkspaceColumns = ({
    handleActive,
    handleEdit,
    handleConfirmation,
    accessPermission,
}: ColumnsProps): ColumnsType<WorkspaceBody> => [
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
        title: 'Workspace Name',
        sorter: true,
        dataIndex: 'name',
        key: 'name',
    },
    {
        title: 'Monthly Price',
        sorter: true,
        dataIndex: 'monthlyPrice',
        key: 'monthlyPrice',
        render: (data: any) => `₹ ${formatNumberWithLocalString(data)}`,
    },
    {
        title: 'Yearly Price',
        sorter: true,
        dataIndex: 'yearlyPrice',
        key: 'yearlyPrice',
        render: (data: any) => `₹ ${formatNumberWithLocalString(data)}`,
    },
    {
        title: 'Workspace Address',
        sorter: true,
        dataIndex: 'address',
        key: 'address',
    },
    {
        title: 'Lat/Long',
        sorter: true,
        dataIndex: 'latLng',
        key: 'latLng',
    },
    {
        title: 'Logo',
        dataIndex: 'logo',
        key: 'logo',
        render: (url: string) => (
            <>
                {url ? (
                    <a href={url} target="_blank" rel="noreferrer">
                        <EyeOutlined />
                    </a>
                ) : (
                    <EyeOutlined />
                )}
            </>
        ),
    },
    {
        title: 'Status',
        sorter: true,
        dataIndex: 'status',
        key: 'status',
        render: (isActive: any, record: WorkspaceBody) => (
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
        render: (_: any, record: WorkspaceBody) => (
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
        render: (_: any, record: WorkspaceBody) => (
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

export default getWorkspaceColumns;
