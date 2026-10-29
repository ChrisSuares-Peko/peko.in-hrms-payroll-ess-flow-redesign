import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import { Vendor } from '../../types/vendors';
import { vendorTypes } from '../vendorsType';

interface ColumnsProps {
    handleActive: (connectId: number | string, isActive: any) => void;
    handleEdit: (record: Vendor) => void;
    accessPermission: any;
}

const getVendorColumns = ({
    handleActive,
    handleEdit,
    accessPermission,
}: ColumnsProps): ColumnsType<Vendor> => [
    {
        title: 'Date',
        sorter: true,
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (createdAt: any) => (
            <Flex vertical>
                <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Vendor Name',
        sorter: true,
        dataIndex: 'vendorName',
        key: 'vendorName',
        width: 180,
        ellipsis: true,
    },
    {
        title: 'API URL',
        sorter: true,
        dataIndex: 'apiUrl',
        key: 'apiUrl',
        width: 280,
        ellipsis: true,
        render: (apiUrl: string) => (
            <Tooltip title={apiUrl || '-'}>
                <Typography.Text ellipsis style={{ maxWidth: 260, display: 'inline-block' }}>
                    {apiUrl || '-'}
                </Typography.Text>
            </Tooltip>
        ),
    },
    {
        title: 'Health URL',
        sorter: true,
        dataIndex: 'healthUrl',
        key: 'healthUrl',
        width: 280,
        ellipsis: true,
        render: (healthUrl: string) => (
            <Tooltip title={healthUrl || '-'}>
                <Typography.Text ellipsis style={{ maxWidth: 260, display: 'inline-block' }}>
                    {healthUrl || '-'}
                </Typography.Text>
            </Tooltip>
        ),
    },
    // {
    //     title: 'Vendor Email',
    //     sorter: true,
    //     dataIndex: 'vendorEmail',
    //     key: 'vendorEmail',
    // },
    {
        title: 'Type',
        sorter: true,
        dataIndex: 'type',
        key: 'type',
        width: 140,
        render: (type: string) => {
            const vendorType = vendorTypes.find(item => item.value === type);
            return vendorType ? vendorType.label : type;
        },
    },
    {
        title: 'Status',
        sorter: true,
        dataIndex: 'isActive',
        key: 'isActive',
        width: 100,
        render: (isActive: any, record: Vendor) => (
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
                                accessPermission?.update && handleActive(record.id, record.isActive)
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
                                accessPermission?.update && handleActive(record.id, record.isActive)
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
        width: 80,
        render: (_: any, record: Vendor) => (
            <Flex justify="space-between">
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
                            <EditOutlined
                                style={{ color: 'gray', cursor: 'not-allowed' }}
                                disabled
                            />
                        ) : (
                            <EditOutlined onClick={() => handleEdit(record)} />
                        )}
                    </span>
                </Tooltip>
            </Flex>
        ),
    },
];

export default getVendorColumns;
