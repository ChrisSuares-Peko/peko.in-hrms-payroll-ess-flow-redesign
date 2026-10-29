import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Select } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { Field, FieldProps } from 'formik';

import { DropDown } from '@customtypes/general';

interface SelectInputProps {
    name: string;
    label?: string;
    placeholder: string;
    size?: SizeType;
    isDisabled?: boolean;
    isRequired?: boolean;
    classes?: string;
    options: DropDown | any[];
    showToolTip?: boolean;
    tooltipText?: string;
    handleChange?: (value: string) => void;
    onSearch?: (value: string) => void;
    allowClear?: boolean;
    showSearch?: boolean;
    filterOption?: boolean;
}

const SelectInput: React.FC<SelectInputProps> = ({
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
    handleChange,
    onSearch,
    allowClear,
    showSearch,
    filterOption,
}) => (
    <Field name={name}>
        {({ field, form: { touched, errors, values, setFieldValue } }: FieldProps) => (
            <Form.Item
                label={label}
                name={name}
                required={isRequired}
                validateStatus={touched[name] && errors[name] ? 'error' : ''}
                help={touched[name] && errors[name] ? (errors[name] as React.ReactNode) : undefined}
                {...(showToolTip && {
                    tooltip: {
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
                    },
                })}
            >
                <Select
                    allowClear={allowClear}
                    showSearch={showSearch}
                    placeholder={placeholder}
                    disabled={isDisabled}
                    defaultValue={field.value !== '' ? field.value : undefined}
                    className={classes}
                    onSearch={onSearch}
                    size={size}
                    filterOption={filterOption}
                    onChange={e => {
                        setFieldValue(name, e);
                        if (handleChange) handleChange(e);
                    }}
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
export default SelectInput;
