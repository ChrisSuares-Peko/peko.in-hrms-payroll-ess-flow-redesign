import React from 'react';

import { CheckCircleFilled, InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Form, Input, Typography } from 'antd';
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
}

const VerifyTextInputTwo: React.FC<TextInputProps> = ({
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
}) => (
    <Field name={name}>
        {({ field, form: { touched, errors, setFieldValue } }: FieldProps) => (
            <Form.Item
                label={
                    <Flex justify="start" align="center">
                        <span>{label}</span>
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
                <Flex>
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
                            }}
                        />{' '}
                    </Flex>
                    {!isVerified ? (
                        <Flex className="min-w-[1rem] pl-4" align="center" justify="start">
                            <Typography.Link
                                onClick={onVerify}
                                style={{ marginLeft: '8px', color: '#FF4D4F', fontSize: 'small' }}
                            >
                                Verify
                            </Typography.Link>
                        </Flex>
                    ) : (
                        <Flex className="min-w-[1rem] pl-4" align="center" justify="start">
                            <CheckCircleFilled
                                style={{ color: '#21AD64', fontSize: '18px', marginLeft: '8px' }}
                            />
                        </Flex>
                    )}
                </Flex>
            </Form.Item>
        )}
    </Field>
);

export default VerifyTextInputTwo;
