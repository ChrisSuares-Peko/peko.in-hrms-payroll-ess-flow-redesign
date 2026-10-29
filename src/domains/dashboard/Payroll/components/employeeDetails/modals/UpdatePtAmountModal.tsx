import React, { useState } from 'react';

import { Button, Drawer, Flex, Input, Typography } from 'antd';

const { Text } = Typography;

interface UpdatePtAmountModalProps {
    open: boolean;
    employeeName: string;
    employeeCode: string;
    initialAmount: number;
    isLoading?: boolean;
    onCancel: () => void;
    onSave: (amount: number) => Promise<any>;
}

const UpdatePtAmountModal = ({
    open,
    employeeName,
    employeeCode,
    initialAmount,
    isLoading = false,
    onCancel,
    onSave,
}: UpdatePtAmountModalProps) => {
    const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value.replace(/[^0-9]/g, ''));
    };

    const handleSave = async () => {
        if (!amount) return;
        const result = await onSave(Number(amount));
        if (result) onCancel();
    };

    return (
        <Drawer
            title="Update Professional Tax"
            open={open}
            onClose={onCancel}
            width={480}
            styles={{ body: { paddingInline: 20, paddingBlock: 16 }, header: { paddingInline: 20 } }}
            footer={
                <Flex justify="end" gap={10}>
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button type="primary" danger loading={isLoading} disabled={!amount} onClick={handleSave}>
                        Save
                    </Button>
                </Flex>
            }
        >
            <Flex vertical gap={20}>
                <Text type="secondary">
                    Enter {employeeName}&apos;s monthly Professional Tax amount. PT is a state levy — the amount
                    depends on their work state&apos;s slab (most states deduct ₹200/month, capped at ₹2,500/year).
                    It is deducted from net pay and counts towards the Old-regime Section 16(iii) exemption.
                </Text>
                <Flex vertical gap={8} style={{ border: '1px solid #F0F0F0', borderRadius: 8, padding: 12 }}>
                    <Flex vertical>
                        <Text style={{ fontWeight: 500 }}>{employeeName}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {employeeCode}
                        </Text>
                    </Flex>
                    <Input placeholder="e.g. 200" maxLength={4} value={amount} onChange={handleChange} />
                </Flex>
            </Flex>
        </Drawer>
    );
};

export default UpdatePtAmountModal;
