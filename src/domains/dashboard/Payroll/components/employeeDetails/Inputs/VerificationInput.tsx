import React, { ReactNode } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Input } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { Field, FieldProps } from 'formik';

import useScreenSize from '@src/hooks/useScreenSize';

interface TextInputProps {
    name: string;
    label?: string | ReactNode;
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
    disablePaste?: boolean;
    tooltipText?: string;
    suffix?: any;
    prefix?: any;
    maxLength?: number;
    minLength?: number;
    allowNumbersOnly?: boolean;
    allowDecimalsOnly?: boolean;
    allowTwoDecimalsOnly?: boolean;
    allowAlphabetsAndSpaceOnly?: boolean;
    allowAlphabetsOnly?: boolean;
    allowAlphabetsAndNumbersOnly?: boolean;
    allowAlphabetsSpaceAndNumbersOnly?: boolean;
    allowAlphabetsAndSpecialCharacters?: string[];
    allowAlphabetsNumberAndSpecialCharacters?: string[];
    allowNumbersAndDots?: boolean;
    allowLowerCaseOnly?: boolean;
    allowUpperCaseOnly?: boolean;
    allowEmailsOnly?: boolean;
    handleChange?: (value: string) => void;
    allowedInputKeys?: (value: string) => string;
    readOnly?: boolean;
    values?: string;
    autoComplete?: 'on' | 'off';
    maxValue?: number;
    convertToUppercase?: boolean;
    allowAddressFormat?: boolean;
    allowBeneficiaryNameFormat?: boolean;
    removeEmoji?: boolean;
}

const VerificationInput: React.FC<TextInputProps> = ({
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
    disablePaste = false,
    tooltipText,
    suffix,
    maxLength,
    minLength,
    allowNumbersOnly = false,
    allowDecimalsOnly = false,
    allowTwoDecimalsOnly = false,
    allowAlphabetsOnly = false,
    allowAlphabetsAndSpaceOnly = false,
    allowAlphabetsAndNumbersOnly = false,
    allowAlphabetsSpaceAndNumbersOnly = false,
    allowAlphabetsAndSpecialCharacters,
    allowAlphabetsNumberAndSpecialCharacters,
    allowNumbersAndDots = false,
    allowLowerCaseOnly = false,
    allowUpperCaseOnly = false,
    allowEmailsOnly = false,
    allowAddressFormat = false,
    allowBeneficiaryNameFormat = false,
    allowedInputKeys,
    prefix,
    handleChange,
    readOnly = false,
    values,
    maxValue,
    autoComplete = 'on',
    convertToUppercase,
    removeEmoji = true,
}) => {
    const { sm } = useScreenSize();
    const removeEmojis = (str: any) =>
        str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
    return (
        <Field name={name}>
            {({ field, form: { touched, errors, setFieldValue } }: FieldProps) => (
                <Form.Item
                    label={label && <span title="">{label}</span>} // Modified line
                    colon={false} // Added line
                    required={isRequired}
                    validateStatus={touched[name] && errors[name] ? 'error' : ''}
                    help={
                        touched[name] && errors[name]
                            ? (errors[name] as React.ReactNode)
                            : undefined
                    }
                    {...(showToolTip && {
                        tooltip: {
                            title: tooltipText,
                            color: 'white',
                            placement: sm ? 'right' : 'top',
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
                        value={values ?? field.value}
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
                        readOnly={readOnly}
                        autoComplete={autoComplete}
                        onPaste={e => {
                            if (disablePaste) e.preventDefault();
                        }}
                        onChange={e => {
                            let { value } = e.target;
                            if (removeEmoji) {
                                value = removeEmojis(e.target.value);
                            }
                            if (convertToUppercase) {
                                value = value.toUpperCase();
                            }
                            let filteredValue = value;
                            if (allowNumbersOnly) {
                                filteredValue = value.replace(/[^\d]/g, '');
                                if (maxValue && parseInt(filteredValue, 10) > maxValue) {
                                    filteredValue = maxValue.toString();
                                }
                            }
                            if (allowAlphabetsNumberAndSpecialCharacters) {
                                const allowedChars =
                                    allowAlphabetsNumberAndSpecialCharacters.join('');
                                const regex = new RegExp(`[^a-zA-Z0-9${allowedChars}]`, 'g');
                                filteredValue = value.replace(regex, '');
                            }
                            if (allowAlphabetsAndSpecialCharacters) {
                                const allowedChars = allowAlphabetsAndSpecialCharacters.join('');
                                const regex = new RegExp(`[^a-zA-Z${allowedChars}]`, 'g');
                                filteredValue = value.replace(regex, '');
                            }
                            if (allowDecimalsOnly || allowTwoDecimalsOnly) {
                                // Ensure only valid numeric input with decimal points
                                filteredValue = value
                                    .replace(/[^0-9.]/g, '') // Allow only numbers and dots
                                    .replace(/(\..*?)\..*/g, '$1'); // Remove additional dots

                                // Prevent NaN if only "." is entered
                                if (filteredValue === '.') {
                                    filteredValue = '0.';
                                }
                                if (allowTwoDecimalsOnly) {
                                    filteredValue = filteredValue.replace(/(\.\d{2})\d+/, '$1');
                                }
                            }
                            if (allowAlphabetsOnly) {
                                filteredValue = value.replace(/[^a-zA-Z]/g, '');
                            }
                            if (allowAlphabetsAndSpaceOnly) {
                                filteredValue = value.replace(/[^a-zA-Z ]/g, '');
                            }
                            if (allowUpperCaseOnly) {
                                filteredValue = filteredValue.toUpperCase();
                            }

                            if (allowAlphabetsAndNumbersOnly) {
                                filteredValue = filteredValue.replace(/[^A-Z0-9]/g, '');
                            }

                            if (allowAlphabetsSpaceAndNumbersOnly) {
                                filteredValue = value.replace(/[^a-zA-Z0-9 ]/g, '');
                            }
                            if (allowNumbersAndDots) {
                                filteredValue = value.replace(/[^\d.]/g, '');
                            }
                            if (allowLowerCaseOnly) {
                                filteredValue = value.toLowerCase();
                            }

                            if (allowEmailsOnly) {
                                filteredValue = value
                                    .replace(/[^a-zA-Z0-9@._-]/g, '') // Allow only valid email characters
                                    .replace(/[^@]*@[^.]*\./g, match =>
                                        match.replace(/[^a-zA-Z0-9@._-]/g, '')
                                    ); // Keep valid email format
                            }
                            if (allowedInputKeys) {
                                filteredValue = allowedInputKeys(value);
                            }
                            if (allowBeneficiaryNameFormat) {
                                filteredValue = value.replace(/[^a-zA-Z0-9@&_\-./: ]/g, '');
                            }
                            setFieldValue(name, filteredValue);
                            if (handleChange) handleChange(filteredValue);
                        }}
                    />
                </Form.Item>
            )}
        </Field>
    );
};

export default VerificationInput;
