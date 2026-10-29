import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Input } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { Field, FieldProps } from 'formik';

interface TextInputProps {
    name: string;
    label?: string;
    placeholder?: string;
    type: string;
    size?: SizeType;
    isDisabled?: boolean;
    isRequired?: boolean;
    values?: any; // Add value prop
    classes?: string;
    formItemClass?: string;
    addonBefore?: any;
    showToolTip?: boolean;
    tooltipText?: string;
    suffix?: any;
    prefix?: any;
    maxLength?: number;
    minLength?: number;
    allowNumbersOnly?: boolean;
    allowDecimalsOnly?: boolean;
    allowAlphabetsAndSpaceOnly?: boolean;
    allowAlphabetsAndNumbersOnly?: boolean;
    allowAlphabetsSpaceAndNumbersOnly?: boolean;
    allowUpperCaseOnly?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
    name,
    label,
    placeholder,
    type,
    size,
    isDisabled,
    isRequired,
    addonBefore,
    classes,
    values,
    formItemClass,
    showToolTip = false,
    tooltipText,
    suffix,
    maxLength,
    minLength,
    allowNumbersOnly = false,
    allowDecimalsOnly = false,
    allowAlphabetsAndSpaceOnly = false,
    allowAlphabetsAndNumbersOnly = false,
    allowAlphabetsSpaceAndNumbersOnly = false,
    allowUpperCaseOnly = false,
    prefix,
}) => (
    <Field name={name}>
        {({ field, form: { touched, errors, setFieldValue, submitCount } }: FieldProps) => (
            <Form.Item
                label={label}
                required={isRequired}
                validateStatus={(touched[name] || submitCount > 0) && errors[name] ? 'error' : ''}
                help={(touched[name] || submitCount > 0) && errors[name] ? (errors[name] as React.ReactNode) : undefined}
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
                className={formItemClass}
            >
                <Input
                    {...field}
                    maxLength={maxLength}
                    minLength={minLength}
                    value={values || field.value}
                    type={type}
                    size={size ?? 'middle'}
                    placeholder={placeholder}
                    disabled={isDisabled}
                    className={classes}
                    addonBefore={addonBefore}
                    suffix={suffix}
                    prefix={prefix}
                    onChange={e => {
                        const { value } = e.target;
                        let filteredValue = value;
                        if (allowNumbersOnly) {
                            filteredValue = value.replace(/[^\d]/g, '');
                        }
                        if (allowDecimalsOnly) {
                            filteredValue = value
                                .replace(/[^0-9.]/g, '')
                                .replace(/(\..*?)\..*/g, '$1');
                        }
                        if (allowAlphabetsAndSpaceOnly) {
                            filteredValue = value.replace(/[^a-zA-Z ]/g, '');
                        }
                        if (allowAlphabetsAndNumbersOnly) {
                            filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
                        }
                        if (allowAlphabetsSpaceAndNumbersOnly) {
                            filteredValue = value.replace(/[^a-zA-Z0-9 ]/g, '');
                        }
                        if (allowUpperCaseOnly) {
                            filteredValue = value.toUpperCase();
                        }
                        setFieldValue(name, filteredValue);
                    }}
                />
            </Form.Item>
        )}
    </Field>
);

export default TextInput;
