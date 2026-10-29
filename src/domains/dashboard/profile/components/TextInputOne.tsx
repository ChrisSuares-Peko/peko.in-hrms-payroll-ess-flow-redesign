import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Form, Input } from 'antd';
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
    classes?: string;
    formItemClass?: string;
    addonBefore?: any;
    addonAfter?: any;
    showToolTip?: boolean;
    tooltipText?: string;
    suffix?: any;
    prefix?: any;
    maxLength?: number;
    minLength?: number;
    allowNumbersOnly?: boolean;
    allowDecimalsOnly?: boolean;
    allowTwoDecimalsOnly?: boolean;
    allowAlphabetsAndSpaceOnly?: boolean;
    allowAlphabetsAndNumbersOnly?: boolean;
    allowAlphabetsSpaceAndNumbersOnly?: boolean;
    allowNumbersAndDots?: boolean;
    handleChange?: (value: string) => void;
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
    addonAfter,
    classes,
    formItemClass,
    showToolTip = false,
    tooltipText,
    suffix,
    maxLength,
    minLength,
    allowNumbersOnly = false,
    allowDecimalsOnly = false,
    allowTwoDecimalsOnly = false,
    allowAlphabetsAndSpaceOnly = false,
    allowAlphabetsAndNumbersOnly = false,
    allowAlphabetsSpaceAndNumbersOnly = false,
    allowNumbersAndDots = false,
    prefix,
    handleChange,
}) => (
    <Field name={name}>
        {({ field, form: { touched, errors, setFieldValue } }: FieldProps) => (
            <Form.Item
                label={label}
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
                className={formItemClass}
            >
                <Flex className="sm:w-[25rem] xs:w-[15rem]">
                    <Input
                        {...field}
                        maxLength={maxLength}
                        minLength={minLength}
                        type={type}
                        size={size ?? 'middle'}
                        placeholder={placeholder}
                        disabled={isDisabled}
                        className={classes}
                        addonBefore={addonBefore}
                        addonAfter={addonAfter}
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
                            if (allowTwoDecimalsOnly) {
                                filteredValue = value.replace(
                                    /[^\d.]+|(?<=\.\d{2})\d+|\.(?=.*\.)/g,
                                    ''
                                );
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
                            if (allowNumbersAndDots) {
                                filteredValue = value.replace(/[^\d.]/g, '');
                            }
                            setFieldValue(name, filteredValue);
                            if (handleChange) handleChange(e.target.value);
                        }}
                    />
                </Flex>
            </Form.Item>
        )}
    </Field>
);

export default TextInput;
