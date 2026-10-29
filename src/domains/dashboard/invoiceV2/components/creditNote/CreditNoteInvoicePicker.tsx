import { InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Flex, Select, Spin, Typography } from 'antd';

interface Props {
    invoices: { id: string; label: string }[];
    value: string;
    onChange: (invoiceId: string) => void;
    loading?: boolean;
    error?: string;
}

const CreditNoteInvoicePicker = ({ invoices, value, onChange, loading, error }: Props) => (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 mb-4">
        <Alert
            icon={<InfoCircleOutlined />}
            showIcon
            type="info"
            message="GST Requirement"
            description="A Credit Note must reference the original invoice when adjusting or cancelling a GST invoice."
            className="mb-5 rounded-lg"
        />
        <Flex vertical gap={6}>
            <Typography.Text className="text-sm font-medium text-[#42526D]">
                <span className="text-red-500 mr-1">*</span>
                Select Original Invoice
            </Typography.Text>
            {loading ? (
                <Flex justify="center" className="py-4">
                    <Spin size="small" />
                </Flex>
            ) : (
                <Select
                    showSearch
                    placeholder="Search by invoice number or customer..."
                    value={value || undefined}
                    onChange={onChange}
                    filterOption={(input, option) =>
                        String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={invoices.map(inv => ({ value: inv.id, label: inv.label }))}
                    className="w-full h-10"
                    allowClear
                    status={error ? 'error' : ''}
                />
            )}
            {error && (
                <Typography.Text type="danger" className="text-xs">
                    {error}
                </Typography.Text>
            )}
        </Flex>
    </div>
);

export default CreditNoteInvoicePicker;
