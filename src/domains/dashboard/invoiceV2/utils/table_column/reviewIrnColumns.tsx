import type { ColumnsType } from 'antd/es/table';

import { ReviewLineItem } from '../../types/generateIrn';
import { formatAmount } from '../helperFunctions';

const reviewIrnColumns = (igstOnIntra: boolean): ColumnsType<ReviewLineItem> => [
    {
        title: 'Description',
        key: 'description',
        dataIndex: 'description',
        width: 160,
    },
    {
        title: 'HSN',
        key: 'hsnSac',
        dataIndex: 'hsnSac',
        width: 100,
    },
    {
        title: 'Qty',
        key: 'quantity',
        dataIndex: 'quantity',
        width: 100,
        render: (val: number, record: ReviewLineItem) => `${val} ${record.unit}`,
    },
    {
        title: 'Discount',
        key: 'discount',
        dataIndex: 'discount',
        width: 110,
        render: (val: number) => formatAmount(val || 0),
    },
    {
        title: 'Taxable',
        key: 'taxableAmount',
        dataIndex: 'taxableAmount',
        width: 120,
        render: (val: number) => formatAmount(val),
    },
    {
        title: 'GST%',
        key: 'gstRate',
        dataIndex: 'gstRate',
        width: 80,
        render: (val: number) => `${val}%`,
    },
    {
        title: igstOnIntra ? 'IGST' : 'Tax',
        key: 'tax',
        dataIndex: 'tax',
        width: 120,
        render: (val: number) => formatAmount(val),
    },
    {
        title: 'Total',
        key: 'itemTotal',
        dataIndex: 'itemTotal',
        width: 120,
        render: (val: number) => formatAmount(val),
    },
];

export default reviewIrnColumns;
