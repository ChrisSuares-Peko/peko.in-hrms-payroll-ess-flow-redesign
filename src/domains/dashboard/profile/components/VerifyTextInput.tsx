import React from 'react';

import {
    CheckCircleFilled,
    EditOutlined,
    InfoCircleOutlined,
    LoadingOutlined,
} from '@ant-design/icons';
import { Flex, Form, Input, Typography, Spin, Tooltip, theme } from 'antd';
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
    allowAlphabetsAndSpaceOnly?: boolean;
    allowAlphabetsAndNumbersOnly?: boolean;
    allowAlphabetsSpaceAndNumbersOnly?: boolean;
    onVerify?: () => void;
    verifyText: string;
    isVerified?: boolean;
    convertToUppercase?: boolean;
    loading?: boolean;
    handleChange?: (value: string) => void;
    onEdit?: () => void;
}

const VerifyTextInput: React.FC<TextInputProps> = ({
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
    convertToUppercase = false,
    loading = false, // Default to false
    onEdit,
}) => {
    const {
        token: { colorPrimary },
    } = theme.useToken();

    const renderEditAction = () => {
        if (!isDisabled || !onEdit) return null;
        return (
            <Tooltip title={`Edit ${label}`}>
                <button
                    type="button"
                    onClick={onEdit}
                    aria-label={`Edit ${label}`}
                    style={{
                        marginLeft: 8,
                        width: 22,
                        height: 22,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        borderRadius: '50%',
                        background: 'rgba(0, 0, 0, 0.04)',
                        color: colorPrimary,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease, transform 0.15s ease',
                        padding: 0,
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255, 77, 79, 0.1)';
                        e.currentTarget.style.transform = 'scale(1.08)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <EditOutlined style={{ fontSize: 12 }} />
                </button>
            </Tooltip>
        );
    };
    const getVerifyStatus = () => {
        if (isVerified) {
            return (
                <CheckCircleFilled
                    style={{ color: '#21AD64', fontSize: '15px', marginLeft: '8px' }}
                />
            );
        }
        return (
            <Typography.Link
                onClick={loading ? undefined : onVerify} // Disable clicking when loading
                style={{
                    marginLeft: '8px',
                    color: loading ? '#bfbfbf' : '#FF4D4F', // Grey color when loading
                    fontSize: 'small',
                    cursor: loading ? 'not-allowed' : 'pointer',
                }}
            >
                {loading ? (
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 12 }} spin />} />
                ) : (
                    'Verify'
                )}
            </Typography.Link>
        );
    };
    return (
        <Field name={name}>
            {({ field, form: { touched, errors, setFieldValue } }: FieldProps) => (
                <Form.Item
                    label={
                        <Flex justify="start" align="center">
                            <span>{label}</span>
                            {getVerifyStatus()}
                            {renderEditAction()}
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
                            if (convertToUppercase) {
                                value = value.toUpperCase();
                            }

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
                            setFieldValue(name, filteredValue);
                            setFieldValue(verifyText, false);
                            setFieldValue(name, filteredValue);
                            if (handleChange) handleChange(e.target.value);
                        }}
                    />
                </Form.Item>
            )}
        </Field>
    );
};

export default VerifyTextInput;
