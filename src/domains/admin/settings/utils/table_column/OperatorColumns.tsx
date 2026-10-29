import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString, formatNumberWithoutCommas } from '@utils/priceFormat';

import { serviceOperator } from '../../types/serviceOperator';

interface ColumnsProps {
    handleActive: (operatorId: number | string, isActive: any) => void;
    handleEdit: (record: serviceOperator) => void;
    accessPermission: any;
}

const getOperatorColumns = ({
    handleActive,
    handleEdit,
    accessPermission,
}: ColumnsProps): ColumnsType<serviceOperator> => [
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
        title: 'Operator Name',
        sorter: true,
        dataIndex: 'serviceProvider',
        key: 'serviceProvider',
    },
    {
        title: 'Access Key',
        dataIndex: 'accessKey',
        sorter: true,
        key: 'accessKey',
    },
    {
        title: 'Service Category',
        sorter: true,
        dataIndex: 'serviceCategory',
        key: 'serviceCategory',
    },
    {
        title: 'Commission Type',
        sorter: true,
        dataIndex: 'commissionType',
        key: 'commissionType',
    },
    {
        title: 'Commission',
        sorter: true,
        dataIndex: 'providerCommission',
        key: 'providerCommission',
        render: (providerCommission, record: any) => (
            <Typography.Text>
                {record.commissionType === 'PERCENTAGE'
                    ? `${formatNumberWithoutCommas(providerCommission)} %`
                    : `₹ ${formatNumberWithLocalString(providerCommission)}`}
            </Typography.Text>
        ),
    },
    {
        title: 'Vendor Name',
        sorter: true,
        dataIndex: ['vendor', 'vendorName'],
        key: 'vendorName',
        render: (_: any, data: any) => data?.vendor.vendorName || '-',
    },
    {
        title: 'Status',
        sorter: true,
        dataIndex: 'serviceStatus',
        key: 'serviceStatus',
        render: (isActive: any, record: serviceOperator) => (
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
                                accessPermission?.update &&
                                handleActive(record.id!, record.serviceStatus)
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
                                accessPermission?.update &&
                                handleActive(record.id!, record.serviceStatus)
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
        render: (_: any, record: serviceOperator) => (
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
];

export default getOperatorColumns;
