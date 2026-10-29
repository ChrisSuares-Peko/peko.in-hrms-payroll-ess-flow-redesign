import { RightOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';

import ServiceStatusCell from './ServiceStatusCell';
import { AccountingService } from '../../types/services';
import { formatCommissionLabel } from '../../utils/commission';
import ConfiguredIcon from '../common/ConfiguredIcon';

const serviceColumn: ColumnsType<AccountingService>[number] = {
    title: 'Service',
    key: 'serviceProvider',
    dataIndex: 'serviceProvider',
    sorter: true,
    render: (_, record) => (
        <Flex vertical>
            <Typography.Text className="font-medium text-textHeadings">
                {record.serviceProvider}
            </Typography.Text>
            <Typography.Text className="text-xs text-navTextColor">
                {record.accessKey}
            </Typography.Text>
        </Flex>
    ),
};

const vendorColumn: ColumnsType<AccountingService>[number] = {
    title: 'Vendor',
    key: 'vendor.vendorName',
    dataIndex: ['vendor', 'vendorName'],
    sorter: true,
    render: (_, record) => record.vendor?.vendorName || '—',
};

const chevronColumn: ColumnsType<AccountingService>[number] = {
    title: '',
    key: 'chevron',
    width: 48,
    render: () => <RightOutlined className="text-navTextColor" />,
};

export const serviceWithoutPlansColumns = (
    onToggleCommission: (record: AccountingService) => void
): ColumnsType<AccountingService> => [
    serviceColumn,
    vendorColumn,
    {
        title: 'Commission',
        key: 'providerCommission',
        dataIndex: 'providerCommission',
        sorter: true,
        render: (_, record) =>
            formatCommissionLabel(record) ?? (
                <Typography.Text className="text-amber-600">Not configured</Typography.Text>
            ),
    },
    {
        title: 'Status',
        key: 'status',
        render: (_, record) => <ServiceStatusCell service={record} />,
    },
    {
        title: 'Commission Configured',
        key: 'commissionConfigured',
        align: 'center',
        render: (_, record) => (
            <ConfiguredIcon
                configured={record.commissionConfigured}
                onToggle={() => onToggleCommission(record)}
            />
        ),
    },
    chevronColumn,
];

export const serviceWithPlansColumns: ColumnsType<AccountingService> = [
    serviceColumn,
    vendorColumn,
    {
        title: 'Status',
        key: 'status',
        render: (_, record) => <ServiceStatusCell service={record} />,
    },
    chevronColumn,
];
