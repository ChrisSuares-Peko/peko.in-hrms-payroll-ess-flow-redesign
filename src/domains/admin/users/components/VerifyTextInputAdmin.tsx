import React from 'react';

import { CheckCircleFilled, InfoCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Flex, Form, Input, Typography, Spin } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { Field, FieldProps } from 'formik';

import useScreenSize from '@src/hooks/useScreenSize';

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
    allowAlphabetsAndSpaceOnly?: boolean;
    allowAlphabetsAndNumbersOnly?: boolean;
    allowAlphabetsSpaceAndNumbersOnly?: boolean;
    onVerify?: () => void;
    verifyText: string;
    isVerified?: boolean;
    valueInDB?: string;
    convertToUppercase?: boolean;
    loading?: boolean;
    handleChange?: (value: string) => void;
}

const VerifyTextInputAdmin: React.FC<TextInputProps> = ({
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
    allowAlphabetsAndSpaceOnly = false,
    allowAlphabetsAndNumbersOnly = false,
    allowAlphabetsSpaceAndNumbersOnly = false,
    prefix,
    onVerify,
    verifyText,
    isVerified,
    handleChange,
    valueInDB,
    convertToUppercase = false,
    loading = false,
}) => {
    const { xs } = useScreenSize();

    const getVerifyStatus = () => (
        <Flex align="center" gap="small">
            {Number(isVerified) === 1 && (
                <CheckCircleFilled
                    style={{
                        color: '#21AD64',
                        fontSize: xs ? '11px' : '13px',
                        marginLeft: xs ? '6px' : '8px',
                    }}
                />
            )}
            <Typography.Link
                onClick={loading ? undefined : onVerify}
                style={{
                    marginLeft: xs ? '6px' : '8px',
                    color: loading ? '#bfbfbf' : '#FF4D4F',
                    fontSize: xs ? '11px' : '13px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                }}
            >
                {loading ? (
                    <Spin indicator={<LoadingOutlined style={{ fontSize: xs ? 10 : 12 }} spin />} />
                ) : (
                    'Verify'
                )}
            </Typography.Link>
        </Flex>
    );

    return (
        <Field name={name}>
            {({ field, form: { touched, errors, setFieldValue } }: FieldProps) => (
                    <Form.Item
                        label={
                            <Flex justify="start" align="center">
                                <span>{label}</span>
                                {getVerifyStatus()}
                            </Flex>
                        }
                        required={isRequired}
                        validateStatus={
                            (touched[name] && errors[name]) || errors[verifyText] ? 'error' : ''
                        }
                        help={
                            (touched[name] && errors[name]) || errors[verifyText]
                                ? (errors[name] as React.ReactNode) ||
                                  (errors[verifyText] as React.ReactNode)
                                : undefined
                        }
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
                                let { value } = e.target;
                                if (convertToUppercase) value = value.toUpperCase();

                                let filteredValue = value;
                                if (allowNumbersOnly) {
                                    filteredValue = value.replace(/[^\d]/g, '');
                                } else if (allowDecimalsOnly) {
                                    filteredValue = value
                                        .replace(/[^0-9.]/g, '')
                                        .replace(/(\..*?)\..*/g, '$1');
                                } else if (allowAlphabetsAndSpaceOnly) {
                                    filteredValue = value.replace(/[^a-zA-Z ]/g, '');
                                } else if (allowAlphabetsAndNumbersOnly) {
                                    filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
                                } else if (allowAlphabetsSpaceAndNumbersOnly) {
                                    filteredValue = value.replace(/[^a-zA-Z0-9 ]/g, '');
                                }

                                setFieldValue(name, filteredValue);
                                setFieldValue(verifyText, false); // Mark unverified on edit
                                if (handleChange) handleChange(filteredValue);
                            }}
                        />
                    </Form.Item>
            )}
        </Field>
    );
};

export default VerifyTextInputAdmin;
