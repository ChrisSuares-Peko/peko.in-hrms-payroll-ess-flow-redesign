import type { KeyboardEvent, ReactNode } from 'react';

import { MailOutlined, TeamOutlined, UserAddOutlined, UserOutlined } from '@ant-design/icons';
import { Col, Input, Row, Select, Space, Tag, Typography } from 'antd';

import useGetEmployees from '../../hooks/useGetEmployees';
import { PurchasingFor, PurchasingForType } from '../../types';

const { Text } = Typography;

type PurchasingForOption = {
    value: PurchasingForType;
    title: string;
    icon: ReactNode;
};

const PURCHASING_FOR_OPTIONS: PurchasingForOption[] = [
    { value: 'self', title: 'Myself', icon: <UserOutlined /> },
    { value: 'employee', title: 'An Employee', icon: <TeamOutlined /> },
    { value: 'other', title: 'Someone Else', icon: <MailOutlined /> },
];

type PurchasingForSelectorProps = {
    value: PurchasingFor;
    onChange: (value: PurchasingFor) => void;
};

export const PurchasingForSelector = ({ value, onChange }: PurchasingForSelectorProps) => {
    const { employees, isLoading: employeesLoading } = useGetEmployees(value.type === 'employee');

    const handleTypeChange = (type: PurchasingForType) => {
        if (type !== value.type) {
            onChange({ type, name: '', email: '' });
        }
    };

    const handleCardKeyDown = (
        event: KeyboardEvent<HTMLDivElement>,
        type: PurchasingForType
    ) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleTypeChange(type);
        }
    };

    return (
        <div className="esim-purchasing-for-section">
            <Space align="center" className="mb-4">
                <UserAddOutlined className="text-red-500" style={{ fontSize: 16 }} />
                <Text strong className="text-[17px]">
                    Purchasing For
                </Text>
                <Tag className="esim-optional-tag">Optional</Tag>
            </Space>

            <Row gutter={[16, 16]}>
                {PURCHASING_FOR_OPTIONS.map(option => (
                    <Col span={24} sm={8} key={option.value}>
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => handleTypeChange(option.value)}
                            onKeyDown={event => handleCardKeyDown(event, option.value)}
                            className={`esim-travel-card esim-purchasing-card ${
                                value.type === option.value ? 'esim-travel-card-active' : ''
                            }`}
                        >
                            <span className="esim-purchasing-card-icon">{option.icon}</span>
                            <Text className="font-medium text-[16px]">{option.title}</Text>
                        </div>
                    </Col>
                ))}
            </Row>

            {value.type === 'self' && (
                <Text className="block text-sm text-gray-500 mt-3">
                    The eSIM details will be sent to your registered email.
                </Text>
            )}

            {value.type === 'employee' && (
                <div className="esim-recipient-fields">
                    <Text className="esim-field-label">Employee</Text>
                    <Select
                        className="w-full esim-recipient-select"
                        size="large"
                        showSearch
                        placeholder="Select employee"
                        loading={employeesLoading}
                        optionFilterProp="label"
                        options={employees}
                        value={value.employeeId || undefined}
                        onChange={(employeeId: string) => {
                            const employee = employees.find(item => item.value === employeeId);
                            onChange({
                                type: 'employee',
                                employeeId,
                                name: employee?.name ?? '',
                                email: employee?.email ?? '',
                            });
                        }}
                    />
                    {value.email && (
                        <Text className="block text-sm text-gray-500 mt-2">
                            The eSIM details will be emailed to {value.email}.
                        </Text>
                    )}
                </div>
            )}

            {value.type === 'other' && (
                <>
                    <Row gutter={[20, 16]} className="esim-recipient-fields">
                        <Col span={24} sm={12}>
                            <Text className="esim-field-label">Full name</Text>
                            <Input
                                className="esim-recipient-input"
                                size="large"
                                placeholder="e.g. Rhea Kapoor"
                                value={value.name}
                                onChange={e => onChange({ ...value, name: e.target.value })}
                            />
                        </Col>
                        <Col span={24} sm={12}>
                            <Text className="esim-field-label">Email ID</Text>
                            <Input
                                className="esim-recipient-input"
                                size="large"
                                type="email"
                                placeholder="name@example.com"
                                value={value.email}
                                onChange={e => onChange({ ...value, email: e.target.value })}
                            />
                        </Col>
                    </Row>
                    <Text className="block text-sm text-gray-500 mt-2">
                        The eSIM details will be emailed to them.
                    </Text>
                </>
            )}
        </div>
    );
};
