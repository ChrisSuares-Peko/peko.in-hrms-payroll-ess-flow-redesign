import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import BeforeCommissionNote from '@components/atomic/BeforeCommissionNote';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { CatalogRow } from '../../types/businessRegistrationCatalog';

interface ColumnsProps {
    handleActive: (id: number | string, isActive: boolean) => void;
    handleEdit: (record: CatalogRow) => void;
}

const money = (value: string | number | null) =>
    value === null || value === undefined || value === '' ? (
        '—'
    ) : (
        <Typography.Text>₹ {formatNumberWithLocalString(Number(value))}</Typography.Text>
    );

const hasCustomAmount = (record: CatalogRow) =>
    record.amount !== null && record.amount !== undefined && record.amount !== '';

const getCatalogColumns = ({ handleActive, handleEdit }: ColumnsProps): ColumnsType<CatalogRow> => [
    { title: 'Service', dataIndex: 'serviceName', key: 'serviceName' },
    { title: 'Variant', dataIndex: 'variantName', key: 'variantName' },
    {
        title: 'Vendor Price',
        dataIndex: 'vendorPrice',
        key: 'vendorPrice',
        render: (data: string, record: CatalogRow) => (
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
        render: (data: string | null, record: CatalogRow) => (
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
        render: (isActive: boolean, record: CatalogRow) =>
            isActive ? (
                <CheckOutlined
                    className="cursor-pointer text-textLime"
                    onClick={() => handleActive(record.id, record.status)}
                />
            ) : (
                <CloseOutlined
                    className="cursor-pointer text-brandColor"
                    onClick={() => handleActive(record.id, record.status)}
                />
            ),
    },
    {
        title: 'Edit',
        dataIndex: 'action',
        key: 'edit',
        render: (_: unknown, record: CatalogRow) => (
            <EditOutlined className="cursor-pointer" onClick={() => handleEdit(record)} />
        ),
    },
];

export default getCatalogColumns;
