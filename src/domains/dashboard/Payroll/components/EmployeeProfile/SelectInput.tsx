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
    allowClear?: boolean;
    isRequired?: boolean;
    classes?: string;
    options: DropDown | any[];
    showToolTip?: boolean;
    tooltipText?: string;
    defaultValue?: string;
    onClick?: () => void;
    onChange?: (value: string | number | undefined) => void;
    mode?: any;
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
    defaultValue,
    allowClear,
    onClick,
    onChange,
    mode,
}) => (
    <Field name={name}>
        {({ form: { touched, errors, values, setFieldValue } }: FieldProps) => (
            <Form.Item
                label={label && <span title="">{label}</span>}
                required={isRequired}
                validateStatus={touched[name] && errors[name] ? 'error' : ''}
                help={touched[name] && errors[name] ? (errors[name] as React.ReactNode) : undefined}
                // Must be omitted entirely (not merely `false`) when disabled — antd's
                // Form.Item treats an explicit `tooltip={false}` differently from the prop
                // being absent, rendering its own default question-mark icon with an empty
                // tooltip instead of nothing. `undefined` here is what actually suppresses it.
                tooltip={
                    showToolTip
                        ? {
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
                        : undefined
                }
            >
                <Select
                    placeholder={placeholder}
                    disabled={isDisabled}
                    mode={mode}
                    value={values[name] !== '' ? values[name] : defaultValue}
                    // value={defaultValue || undefined}
                    allowClear={allowClear}
                    className={classes}
                    size={size}
                    // onChange={e => setFieldValue(name, e)}
                    onChange={value => {
                        setFieldValue(name, value); // Update the formik field
                        if (onChange) {
                            onChange(value); // Execute custom onChange if provided
                        }
                    }}
                    onClick={() => {
                        if (onClick) {
                            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                            onClick && onClick();
                        }
                    }}
                    // allowClear
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
