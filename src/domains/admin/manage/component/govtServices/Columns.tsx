import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import BeforeCommissionNote from '@components/atomic/BeforeCommissionNote';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { GovtService, RolePermissionAccessData } from '../../types/govtServicesTypes';

interface ColumnsProps {
    handleActive: (record: GovtService) => void;
    handleEdit: (record: GovtService) => void;
    accessPermission: RolePermissionAccessData | undefined;
}

const money = (value: string | number | null) =>
    value === null || value === undefined || value === '' ? (
        '—'
    ) : (
        <Typography.Text>₹ {formatNumberWithLocalString(Number(value))}</Typography.Text>
    );

const hasCustomAmount = (record: GovtService) =>
    record.amount !== null && record.amount !== undefined && record.amount !== '';

const getGovtServiceColumns = ({ handleActive, handleEdit, accessPermission }: ColumnsProps): ColumnsType<GovtService> => [
    { title: 'Service', dataIndex: 'serviceName', key: 'serviceName' },
    { title: 'Variant', dataIndex: 'variantName', key: 'variantName' },
    {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        render: (data: string, record: GovtService) => (
            <Flex vertical>
                {money(data)}
                {!hasCustomAmount(record) && (
                    <BeforeCommissionNote amount={data} totalCommission={record.totalCommission} />
                )}
            </Flex>
        ),
    },
    {
        title: 'Custom Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (data: string | null, record: GovtService) => (
            <Flex vertical>
                {money(data)}
                {hasCustomAmount(record) && (
                    <BeforeCommissionNote amount={data} totalCommission={record.totalCommission} />
                )}
            </Flex>
        ),
    },
    { title: 'Order', dataIndex: 'sortOrder', key: 'sortOrder', width: '8%' },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (isActive: boolean, record: GovtService) => (
            <Tooltip
                placement="top"
                title={!accessPermission?.update ? 'Sorry, you do not have permission to perform this action' : ''}
            >
                <span>
                    {isActive ? (
                        <CheckOutlined
                            className={`cursor-pointer ${accessPermission?.update ? 'text-textLime' : 'text-gray-400'}`}
                            style={{ cursor: accessPermission?.update ? 'pointer' : 'not-allowed' }}
                            onClick={() => accessPermission?.update && handleActive(record)}
                        />
                    ) : (
                        <CloseOutlined
                            className={`cursor-pointer ${accessPermission?.update ? 'text-brandColor' : 'text-gray-400'}`}
                            style={{ cursor: accessPermission?.update ? 'pointer' : 'not-allowed' }}
                            onClick={() => accessPermission?.update && handleActive(record)}
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
        render: (_: unknown, record: GovtService) => (
            <Tooltip
                placement="top"
                title={!accessPermission?.update ? 'Sorry, you do not have permission to perform this action' : ''}
            >
                <span>
                    {accessPermission?.update ? (
                        <EditOutlined className="cursor-pointer" onClick={() => handleEdit(record)} />
                    ) : (
                        <EditOutlined style={{ color: 'gray', cursor: 'not-allowed' }} />
                    )}
                </span>
            </Tooltip>
        ),
    },
];

export default getGovtServiceColumns;
