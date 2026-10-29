import { Button, Drawer, Flex, Input, InputNumber, Space, Typography } from 'antd';

interface SettlementRequestDrawerProps {
    open: boolean;
    width: number | string;
    onClose: () => void;
    onSubmit: () => void;
    loading?: boolean;
    amount: number | null;
    onAmountChange: (value: number | null) => void;
    amountError: string;
    remarks: string;
    onRemarksChange: (value: string) => void;
    remarksError: string;
}

const SettlementRequestDrawer = ({
    open,
    width,
    onClose,
    onSubmit,
    loading = false,
    amount,
    onAmountChange,
    amountError,
    remarks,
    onRemarksChange,
    remarksError,
}: SettlementRequestDrawerProps) => (
    <Drawer
        title="Create Settlement Request"
        placement="right"
        width={width}
        open={open}
        onClose={onClose}
        destroyOnClose={false}
        zIndex={1100}
        footer={
            <Flex gap={10}>
                <Button style={{ flex: 1 }} onClick={onClose}>
                    Cancel
                </Button>
                <Button type="primary" danger style={{ flex: 1 }} onClick={onSubmit} loading={loading} disabled={loading}>
                    Create Request
                </Button>
            </Flex>
        }
    >
        <Flex vertical gap={24}>
            <Flex vertical gap={4}>
                <Typography.Text type="secondary">
                    Create a settlement request to track withdrawals from your virtual account.
                </Typography.Text>
            </Flex>

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Typography.Text type="secondary">Amount</Typography.Text>
                    <InputNumber
                        size="large"
                        style={{ width: '100%' }}
                        value={amount}
                        min={0.01}
                        precision={2}
                        controls={false}
                        addonBefore="₹"
                        placeholder="Enter request amount"
                        onChange={onAmountChange}
                        status={amountError ? 'error' : ''}
                    />
                    {amountError ? <Typography.Text type="danger">{amountError}</Typography.Text> : null}
                </Space>

                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Typography.Text type="secondary">Remarks</Typography.Text>
                    <Input.TextArea
                        size="large"
                        rows={5}
                        value={remarks}
                        maxLength={250}
                        placeholder="Add remarks for this settlement request"
                        onChange={event => onRemarksChange(event.target.value)}
                        status={remarksError ? 'error' : ''}
                    />
                    {remarksError ? <Typography.Text type="danger">{remarksError}</Typography.Text> : null}
                </Space>
            </Space>
        </Flex>
    </Drawer>
);

export default SettlementRequestDrawer;
