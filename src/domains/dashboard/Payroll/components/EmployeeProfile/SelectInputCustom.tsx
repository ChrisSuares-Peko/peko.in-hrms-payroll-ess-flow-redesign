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
    defaultValue?: string;

    onSearch?: (value: string) => void; // Add onSearch prop
}

const SelectInputCustom: React.FC<SelectInputProps> = ({
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
    defaultValue,
    onSearch, // Destructure onSearch prop
}) => (
    <Field name={name}>
        {({ form: { touched, errors, values, setFieldValue } }: FieldProps) => (
            <Form.Item
                label={label && <span title="">{label}</span>} // Line modified
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
                    placeholder={placeholder}
                    disabled={isDisabled}
                    value={values[name] !== '' ? values[name] : defaultValue}
                    className={classes}
                    size={size}
                    onChange={e => setFieldValue(name, e)}
                    showSearch // Enable showSearch
                    onSearch={onSearch} // Pass onSearch prop
                    // Disable default filter
                    //                   filterOption={(inputValue, option) =>
                    //     option?.children?.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                    // }
                    filterOption={(inputValue, option) => {
                        if (
                            typeof option?.children === 'string' ||
                            typeof option?.children === 'number'
                        ) {
                            const childrenString = String(option?.children);
                            return childrenString.toLowerCase().includes(inputValue.toLowerCase());
                        }
                        return false;
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

export default SelectInputCustom;
