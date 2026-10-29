import React, { ReactNode } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Select, Form, Tooltip } from 'antd';
import { Field, FieldProps } from 'formik';

interface ItemProps {
    label: string;
    value: string;
}

interface PageSelectInputProps {
    name: string;
    label?: string | ReactNode;
    placeholder: string;
    size?: 'small' | 'middle' | 'large';
    isDisabled?: boolean;
    isRequired?: boolean;
    classes?: string;
    options: ItemProps[];
    showToolTip?: boolean;
    tooltipText?: string;
}

const PageSelectInput: React.FC<PageSelectInputProps> = ({
    name,
    label,
    placeholder,
    size = 'middle',
    isDisabled,
    isRequired,
    classes,
    options,
    showToolTip = false,
    tooltipText,
}) => (
    <Field name={name}>
        {({
            field,
            form: { touched, errors, setFieldValue, setFieldTouched },
        }: FieldProps<string[]>) => (
            <Form.Item
                label={label}
                required={isRequired}
                validateStatus={touched[name] && errors[name] ? 'error' : ''}
                help={touched[name] && errors[name] ? (errors[name] as React.ReactNode) : undefined}
                tooltip={
                    showToolTip && {
                        title: tooltipText,
                        color: 'white',
                        placement: 'right',
                        icon: <InfoCircleOutlined />,
                        overlayInnerStyle: {
                            color: '#171717',
                        },
                        overlayStyle: {
                            minWidth: 300,
                        },
                    }
                }
            >
                <Select
                    {...field}
                    mode="multiple"
                    placeholder={placeholder}
                    disabled={isDisabled}
                    className={classes}
                    allowClear
                    size={size}
                    onChange={(selectedValues: string[]) => {
                        // Mark the field as touched when changed
                        setFieldTouched(name, true);

                        // Logic to handle the "All" option
                        if (selectedValues.includes('all')) {
                            if (selectedValues.length > 1 && selectedValues[0] === 'all') {
                                selectedValues = selectedValues.filter(value => value !== 'all');
                            } else {
                                selectedValues = selectedValues.filter(value => value === 'all');
                            }
                        }
                        setFieldValue(name, selectedValues);
                    }}
                    maxTagCount="responsive"
                    maxTagPlaceholder={omittedValues => (
                        <Tooltip
                            title={omittedValues.map(({ label: label2 }) => label2).join(', ')}
                        >
                            <span className="cursor-pointer">{`+${omittedValues.length}...`}</span>
                        </Tooltip>
                    )}
                >
                    {options.map((option, index) => (
                        <Select.Option key={index} value={option.value}>
                            {option.label}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>
        )}
    </Field>
);

export default PageSelectInput;
