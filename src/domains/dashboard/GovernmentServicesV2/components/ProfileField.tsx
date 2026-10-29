import { ReactNode } from 'react';

import { Flex, Input, Select, Typography } from 'antd';

const { Text } = Typography;

interface ProfileFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    isSelect?: boolean;
    options?: { label: string; value: string }[];
    error?: string;
    suffix?: ReactNode;
    placeholder?: string;
    required?: boolean;
}

// A single labeled input/select on ServiceDetail's profile form, with an inline error message.
const ProfileField = ({
    label,
    value,
    onChange,
    isSelect = false,
    options,
    error,
    suffix,
    placeholder,
    required = true,
}: ProfileFieldProps) => (
    <Flex vertical gap={6}>
        <Text className="text-sm" style={{ color: '#595959' }}>
            {label}
            {required && <span style={{ color: '#FF3A3A' }}> *</span>}
        </Text>
        {isSelect ? (
            <Select
                value={value || undefined}
                onChange={v => onChange(v)}
                options={options}
                placeholder={placeholder ?? `Select ${label}`}
                showSearch
                optionFilterProp="label"
                style={{ height: 40 }}
                status={error ? 'error' : undefined}
            />
        ) : (
            <Input
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{ height: 40, borderRadius: 6 }}
                status={error ? 'error' : undefined}
                suffix={suffix}
                placeholder={placeholder}
            />
        )}
        {error && (
            <Text className="text-sm" style={{ color: '#FF3A3A' }}>
                {error}
            </Text>
        )}
    </Flex>
);

export default ProfileField;
