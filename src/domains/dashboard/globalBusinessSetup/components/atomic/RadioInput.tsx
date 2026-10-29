import { useEffect } from 'react';

import { Form, Radio, Space } from 'antd';
import { useField } from 'formik';

interface Option {
    label: string;
    value: string | number;
}

interface CustomRadioProps {
    name: string;
    label?: string;
    required?: boolean;
    options: Option[];
    description?: string;
    disabled?: boolean;
    defaultValue?: string | number;
}

export default function CustomRadio({
    name,
    label,
    required = false,
    options,
    description,
    disabled = false,
    defaultValue,
}: CustomRadioProps) {
    const [field, meta, helpers] = useField(name);

    useEffect(() => {
        if (defaultValue !== undefined && (field.value === undefined || field.value === '')) {
            helpers.setValue(defaultValue);
        }
    }, [defaultValue, field.value, helpers]);

    return (
        <Form.Item
            validateStatus={meta.touched && meta.error ? 'error' : ''}
            help={meta.touched && meta.error ? meta.error : description}
            label={label}
            required={required}
        >
            <Radio.Group
                value={field.value}
                onChange={e => helpers.setValue(e.target.value)}
                onBlur={() => helpers.setTouched(true)}
                disabled={disabled}
            >
                <Space direction="vertical" size={8}>
                    {options.map(option => (
                        <Radio key={option.value} value={option.value}>
                            {option.label}
                        </Radio>
                    ))}
                </Space>
            </Radio.Group>
        </Form.Item>
    );
}
