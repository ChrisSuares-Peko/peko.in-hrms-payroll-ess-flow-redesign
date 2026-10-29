import { useEffect, useState } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Button, Drawer, Flex, Form, Input, Typography } from 'antd';

const { Text } = Typography;

interface SalaryRecord {
    key: string;
    empId: string;
    name: string;
    email: string;
    initials: string;
    avatarBg: string;
    accountNumber: string;
    bankName: string;
    grossSalary: number;
    deduction: number;
    netSalary: number;
}

interface EditSalaryDrawerProps {
    open: boolean;
    onClose: () => void;
    record: SalaryRecord | null;
}

const inputStyle = {
    height: 44,
    borderRadius: 8,
    border: '1px solid #E4E4E7',
    fontSize: 14,
};

const labelStyle = {
    fontSize: 14,
    fontWeight: 500,
    color: '#000000',
};

const EditSalaryDrawer = ({ open, onClose, record }: EditSalaryDrawerProps) => {
    const [gross, setGross] = useState('');
    const [deduction, setDeduction] = useState('');
    const [bonus, setBonus] = useState('');

    useEffect(() => {
        if (record) {
            setGross(record.grossSalary.toString());
            setDeduction(record.deduction.toString());
            setBonus('');
        }
    }, [record]);

    const netSalary = (Number(gross) || 0) - (Number(deduction) || 0) + (Number(bonus) || 0);

    if (!record) return null;

    return (
        <Drawer
            open={open}
            onClose={onClose}
            placement="right"
            width={480}
            closable={false}
            styles={{
                body: { padding: 0 },
                header: { display: 'none' },
            }}
        >
            <Flex vertical style={{ height: '100%' }}>
                {/* Header */}
                <Flex
                    justify="space-between"
                    align="center"
                    style={{ padding: '28px 32px', borderBottom: '1px solid #F1F5F9' }}
                >
                    <Text style={{ fontSize: 20, fontWeight: 600, color: '#1E293B' }}>
                        Edit Salary
                    </Text>
                    <Button
                        type="text"
                        icon={<CloseOutlined style={{ fontSize: 16, color: '#334155' }} />}
                        onClick={onClose}
                        style={{ width: 32, height: 32, padding: 0 }}
                    />
                </Flex>

                {/* Scrollable body */}
                <Flex vertical gap={28} style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
                    {/* Employee card */}
                    <Flex
                        align="center"
                        gap={14}
                        style={{
                            border: '1px solid #E4E4E7',
                            borderRadius: 16,
                            padding: '16px 20px',
                        }}
                    >
                        <Flex
                            align="center"
                            justify="center"
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                background: record.avatarBg,
                                flexShrink: 0,
                            }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: 600, color: '#FF9F9F' }}>
                                {record.initials}
                            </Text>
                        </Flex>
                        <Flex vertical gap={2}>
                            <Text style={{ fontSize: 15, fontWeight: 600, color: '#101828' }}>
                                {record.name}
                            </Text>
                            <Text style={{ fontSize: 13, color: '#6B788E' }}>
                                {record.empId}
                            </Text>
                        </Flex>
                    </Flex>

                    {/* Form */}
                    <Form layout="vertical" style={{ width: '100%' }}>
                        <Form.Item
                            label={<span style={labelStyle}>Employee Name</span>}
                            style={{ marginBottom: 20 }}
                            extra={
                                <Text style={{ fontSize: 12, color: '#52525B' }}>
                                    Name cannot be edited here.
                                </Text>
                            }
                        >
                            <Input
                                value={record.name}
                                readOnly
                                style={{ ...inputStyle, background: '#F7F7F7', color: '#A1A1AA' }}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={labelStyle}>Employee ID</span>}
                            style={{ marginBottom: 20 }}
                        >
                            <Input
                                value={record.empId}
                                readOnly
                                style={{ ...inputStyle, background: '#F7F7F7', color: '#A1A1AA' }}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={labelStyle}>Account Number</span>}
                            style={{ marginBottom: 20 }}
                        >
                            <Input
                                value={record.accountNumber}
                                readOnly
                                placeholder="—"
                                style={{ ...inputStyle, background: '#F7F7F7', color: '#A1A1AA' }}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={labelStyle}>Gross Salary (₹)</span>}
                            style={{ marginBottom: 20 }}
                        >
                            <Input
                                value={gross}
                                onChange={e => setGross(e.target.value)}
                                prefix="₹"
                                style={inputStyle}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={labelStyle}>Deductions (₹)</span>}
                            style={{ marginBottom: 20 }}
                        >
                            <Input
                                value={deduction}
                                onChange={e => setDeduction(e.target.value)}
                                prefix="₹"
                                style={inputStyle}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={labelStyle}>Bonus (₹)</span>}
                            style={{ marginBottom: 20 }}
                        >
                            <Input
                                value={bonus}
                                onChange={e => setBonus(e.target.value)}
                                placeholder="--"
                                style={inputStyle}
                            />
                        </Form.Item>

                        {/* Net Salary (auto-calculated) */}
                        <Flex justify="space-between" align="center" style={{
                            background: '#ECFDF5',
                            border: '1px solid #CEF7E3',
                            borderRadius: 12,
                            padding: 16,
                        }}>
                            <Flex vertical gap={4}>
                                <Text style={{ fontSize: 12, color: '#8B8B8B' }}>
                                    Net Salary (Auto-calculated)
                                </Text>
                                <Text style={{ fontSize: 15, fontWeight: 600, color: '#000000' }}>
                                    Net Salary
                                </Text>
                            </Flex>
                            <Text style={{ fontSize: 15, fontWeight: 600, color: '#43B75D' }}>
                                ₹{netSalary.toLocaleString('en-IN')}
                            </Text>
                        </Flex>
                    </Form>
                </Flex>

                {/* Footer */}
                <Flex
                    justify="flex-end"
                    gap={12}
                    style={{
                        padding: '20px 32px',
                        borderTop: '1px solid #F1F5F9',
                    }}
                >
                    <Button
                        style={{
                            height: 44,
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 500,
                            border: '1px solid #CBD5E1',
                            color: '#475569',
                        }}
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        danger
                        style={{
                            height: 44,
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 500,
                            background: '#FF4F4F',
                            borderColor: '#FF4F4F',
                        }}
                    >
                        Save change
                    </Button>
                </Flex>
            </Flex>
        </Drawer>
    );
};

export default EditSalaryDrawer;
