import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Space, TableProps, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { deductionTableType } from '../../types/salaryProfileTypes/deductionTypes';

const formatText = (text: string | number) => {
    if (!text) return '';
    const stringText = String(text); // Convert any input to a string
    return stringText.charAt(0).toUpperCase() + stringText.slice(1).toLowerCase();
};
export const deductionColumn = (
    handleDelete: (id: deductionTableType) => void,
    handleEdit: (id: deductionTableType) => void
): TableProps<deductionTableType>['columns'] => [
    {
        title: <Typography.Text>Deduction for</Typography.Text>,
        dataIndex: 'deductionFor',
        key: 'deductionFor',
        // Legacy rows (and the computed leave rows merged into this list) only have the
        // free-text deductionType.
        render: (_: string, record) => record.deductionFor || record.deductionType,
    },
    {
        title: <Typography.Text>Note</Typography.Text>,
        dataIndex: 'note',
        key: 'note',
        render: (text: string) => text || '-',
    },
    {
        title: <Typography.Text>Amount</Typography.Text>,
        dataIndex: 'deductionAmount',
        key: 'deductionAmount',
        render: text => `₹ ${formatNumberWithLocalString(text)}`,
    },

    {
        title: <Typography.Text>Status</Typography.Text>,
        dataIndex: 'deductionStatus',
        key: 'deductionStatus',
        render: text => formatText(text),
    },
    {
        title: <Typography.Text>Action</Typography.Text>,
        dataIndex: 'action',
        key: 'action',
        onCell: () => ({
            style: {
                minHeight: '52.8px',
                display: 'flex',
                alignItems: 'center',
            },
        }),
        render: (text, record) =>
            record.id && (
                <Space size="middle">
                    <Button className="border-0">
                        <DeleteOutlined
                            className="text-[#E30000]"
                            onClick={() => handleDelete(record)}
                        />
                    </Button>
                    <Button className="border-0">
                        <EditOutlined
                            className="text-[#E30000]"
                            onClick={() => handleEdit(record)}
                        />
                    </Button>
                </Space>
            ),
    },
];
