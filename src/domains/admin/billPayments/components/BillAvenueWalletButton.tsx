import { useState } from 'react';

import { WalletOutlined } from '@ant-design/icons';
import { Button, Flex, Form, InputNumber, Modal, Tag, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { useBillAvenueWallet } from '../hooks/useBillAvenueWallet';

// Shows the internally-tracked BillAvenue vendor wallet balance and lets an admin update it after a
// top-up. The balance is checked before every BBPS payment and debited on success (backend), so keeping
// it accurate here is what prevents failed recharges and powers the nightly balance email.
const BillAvenueWalletButton = () => {
    const { wallet, isLoading, isSaving, updateWallet } = useBillAvenueWallet();
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();

    const isLow = !!wallet?.configured && wallet.threshold > 0 && (wallet.balance ?? 0) <= wallet.threshold;
    const label = wallet?.configured
        ? `₹ ${formatNumberWithLocalString(wallet.balance ?? 0)}`
        : 'Set balance';

    const openModal = () => {
        form.setFieldsValue({ balance: wallet?.balance ?? undefined, threshold: wallet?.threshold ?? 0 });
        setOpen(true);
    };

    const handleSubmit = async () => {
        let values;
        try {
            values = await form.validateFields();
        } catch {
            return;
        }
        const ok = await updateWallet(Number(values.balance), Number(values.threshold ?? 0));
        if (ok) setOpen(false);
    };

    return (
        <>
            <Button icon={<WalletOutlined />} loading={isLoading} danger={isLow} onClick={openModal}>
                BillAvenue Wallet: {label}
                {isLow && (
                    <Tag color="error" className="ml-2">
                        Low
                    </Tag>
                )}
            </Button>

            <Modal
                title="BillAvenue Wallet Balance"
                open={open}
                onOk={handleSubmit}
                onCancel={() => setOpen(false)}
                okText="Save"
                confirmLoading={isSaving}
            >
                <Flex vertical gap={12}>
                    <Typography.Text type="secondary">
                        BillAvenue has no balance API — maintain it here and update it after each top-up.
                        BBPS payments are blocked when this balance is insufficient, and it is debited on
                        every successful payment.
                    </Typography.Text>
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="balance"
                            label="Current balance (₹)"
                            rules={[{ required: true, message: 'Enter the current balance' }]}
                        >
                            <InputNumber min={0} step={0.01} className="w-full" placeholder="e.g. 50000" />
                        </Form.Item>
                        <Form.Item name="threshold" label="Low-balance alert threshold (₹)">
                            <InputNumber min={0} step={0.01} className="w-full" placeholder="e.g. 5000" />
                        </Form.Item>
                    </Form>
                    {wallet?.updatedAt && (
                        <Typography.Text type="secondary" className="text-xs">
                            Last updated: {new Date(wallet.updatedAt).toLocaleString()}
                        </Typography.Text>
                    )}
                </Flex>
            </Modal>
        </>
    );
};

export default BillAvenueWalletButton;
