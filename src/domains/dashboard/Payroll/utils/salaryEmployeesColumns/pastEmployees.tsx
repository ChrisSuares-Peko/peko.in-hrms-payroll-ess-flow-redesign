import { Dispatch, SetStateAction } from 'react';

import { Button, Flex, Input, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { formatNumberWithLocalString } from '@utils/priceFormat';

const { Text } = Typography;

export interface PastEmployee {
    key: string;
    empId: string;
    name: string;
    email: string;
    initials: string;
    avatarBg: string;
    joiningDate: string;
    offboardingDate: string;
    fullFinalSettlement: number;
    remark: string;
}

export const getSalaryPastEmployeesColumns = (
    remarks: Record<string, string>,
    setRemarks: Dispatch<SetStateAction<Record<string, string>>>,
    onViewBreakup: (employeeId: string) => void,
    onSaveRemark: (employeeId: string, remark: string) => void,
): ColumnsType<PastEmployee> => [
    {
        title: 'Employee',
        dataIndex: 'name',
        key: 'name',
        render: (name: string, record) => (
            <Flex align="center" gap={10}>
                <Flex
                    align="center"
                    justify="center"
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: record.avatarBg,
                        flexShrink: 0,
                    }}
                >
                    <Text style={{ fontSize: 13, fontWeight: 600, color: '#FF9F9F' }}>
                        {record.initials}
                    </Text>
                </Flex>
                <Flex vertical gap={1}>
                    <Text style={{ fontSize: 14, fontWeight: 500, color: '#101828' }}>{name}</Text>
                    <Text style={{ fontSize: 12, color: '#6B788E' }}>{record.email}</Text>
                </Flex>
            </Flex>
        ),
    },
    {
        title: 'Employee ID',
        dataIndex: 'empId',
        key: 'empId',
        
        render: (empId: string) => (
            <Flex
                align="center"
                justify="center"
                style={{
                    display: 'inline-flex',
                    background: '#F5F6F7',
                    borderRadius: 30,
                    padding: '7px 8px',
                }}
            >
                <Text style={{ fontSize: 14, fontWeight: 500, color: '#091E42', lineHeight: '14px' }}>
                    {empId}
                </Text>
            </Flex>
        ),
    },
    {
        title: 'Joining',
        dataIndex: 'joiningDate',
        key: 'joiningDate',
       
        render: (date: string) => (
            <Text style={{ fontSize: 14, color: '#42526D' }}>{date}</Text>
        ),
    },
    {
        title: 'Offboarding',
        dataIndex: 'offboardingDate',
        key: 'offboardingDate',
        
        render: (date: string) => (
            <Text style={{ fontSize: 14, color: '#42526D' }}>{date}</Text>
        ),
    },
    {
        title: 'Full and Final Settlement',
        dataIndex: 'fullFinalSettlement',
        key: 'fullFinalSettlement',
        width: 150,
        
        render: (amount: number) => (
            <Text style={{ fontSize: 14, color: '#42526D' }}>
                ₹{formatNumberWithLocalString(amount)}
            </Text>
        ),
    },
    {
        title: 'Remark',
        key: 'remark',
        width: 140,
        render: (_, record) => (
            <Input
                placeholder="Remarks"
                value={remarks[record.key] ?? record.remark}
                onChange={e =>
                    setRemarks(prev => ({ ...prev, [record.key]: e.target.value }))
                }
                onPressEnter={() => onSaveRemark(record.key, remarks[record.key] ?? record.remark)}
                style={{
                    height: 32,
                    borderRadius: 6,
                    fontSize: 13,
                    border: '1px solid #E4E4E7',
                    color: '#42526D',
                }}
            />
        ),
    },
    {
        title: 'Breakup',
        key: 'breakup',
        width: 120,
        render: (_, record) => (
            <Button
                danger
                style={{
                    borderRadius: 6,
                    fontSize: 13,
                    height: 32,
                    borderColor: '#FF4F4F',
                    color: '#FF4F4F',
                    background: '#FFFFFF',
                }}
                onClick={() => onViewBreakup(record.key)}
            >
                View breakup
            </Button>
        ),
    },
];
