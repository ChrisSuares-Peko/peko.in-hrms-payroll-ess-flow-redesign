import React, { ReactNode } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Input } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { Field, FieldProps, getIn } from 'formik';

import useScreenSize from '@src/hooks/useScreenSize';

// A raw '-' (or other regex metacharacter) dropped into a character class unescaped can
// silently turn into a range operator (e.g. "/-_" reads as "everything from / to _" in
// ASCII) instead of the three literal characters intended — escaping each one keeps
// allowAlphabetsAndSpecialCharacters/allowAlphabetsNumberAndSpecialCharacters literal
// regardless of which characters or order a caller passes.
const escapeForCharClass = (s: string) => s.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');

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
    // 'light' (default) preserves the existing white-bubble/dark-text tooltip used
    // everywhere this component already shows one; 'dark' renders antd's plain default
    // tooltip instead (dark bubble, white text) — for a screen that specifically calls for
    // that look rather than changing every existing usage's appearance.
    tooltipTheme?: 'light' | 'dark';
    suffix?: any;
    prefix?: any;
    maxLength?: number;
    minLength?: number;
    allowedCharacters?: string;
    allowNumbersOnly?: boolean;
    allowDecimalsOnly?: boolean;
    allowOneDecimalOnly?: boolean;
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
    restrictPanGstFormat?: boolean;
    removeEmoji?: boolean;
    inputMode?:
        | 'search'
        | 'email'
        | 'tel'
        | 'text'
        | 'url'
        | 'none'
        | 'numeric'
        | 'decimal'
        | undefined;
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
    tooltipTheme = 'light',
    disablePaste = false,
    tooltipText,
    suffix,
    maxLength,
    minLength,
    allowedCharacters,
    allowNumbersOnly = false,
    allowDecimalsOnly = false,
    allowTwoDecimalsOnly = false,
    allowOneDecimalOnly = false,
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
    inputMode,
    autoComplete = 'on',
    convertToUppercase,
    restrictPanGstFormat,
    removeEmoji = true,
}) => {
    const { sm } = useScreenSize();
    const removeEmojis = (str: any) =>
        str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
    return (
        <Field name={name}>
            {({ field, form: { touched, errors, setFieldValue } }: FieldProps) => {
            const fieldError = getIn(errors, name);
            const fieldTouched = getIn(touched, name);
            return (
                <Form.Item
                    label={label && <span title="">{label}</span>} // Modified line
                    colon={false} // Added line
                    required={isRequired}
                    validateStatus={fieldTouched && fieldError ? 'error' : ''}
                    help={
                        fieldTouched && fieldError
                            ? (fieldError as React.ReactNode)
                            : undefined
                    }
                    {...(showToolTip && {
                        tooltip: {
                            title: tooltipText,
                            placement: sm ? 'right' : 'top',
                            icon: <InfoCircleOutlined />,
                            ...(tooltipTheme === 'light'
                                ? {
                                      color: 'white',
                                      overlayInnerStyle: { color: '#171717' },
                                      overlayStyle: { minWidth: 300 },
                                  }
                                : {}),
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
                        inputMode={inputMode}
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
                               if (allowedCharacters) {
                                    const regex = new RegExp(`[^${allowedCharacters}]`, 'g');
                                    filteredValue = value.replace(regex, '');
                                }
                            if (restrictPanGstFormat) {
                                filteredValue = value.replace(/\s/g, '');

                                if (maxLength) {
                                    filteredValue = filteredValue.slice(0, maxLength);
                                }
                            }
                            if (allowNumbersOnly) {
                                filteredValue = value.replace(/[^\d]/g, '');
                                if (maxValue && parseInt(filteredValue, 10) > maxValue) {
                                    filteredValue = maxValue.toString();
                                }
                            }
                            if (allowAlphabetsNumberAndSpecialCharacters) {
                                const allowedChars = allowAlphabetsNumberAndSpecialCharacters
                                    .map(escapeForCharClass)
                                    .join('');

                                const regex = new RegExp(`[^a-zA-Z0-9${allowedChars}]`, 'g');
                                filteredValue = value.replace(regex, '');
                            }
                            if (allowAlphabetsAndSpecialCharacters) {
                                const allowedChars = allowAlphabetsAndSpecialCharacters
                                    .map(escapeForCharClass)
                                    .join('');
                                const regex = new RegExp(`[^a-zA-Z0-9 ${allowedChars}]`, 'g');
                                filteredValue = value.replace(regex, '');
                            }
                            if (allowDecimalsOnly || allowTwoDecimalsOnly || allowOneDecimalOnly) {
                                // Ensure only valid numeric input with decimal points
                                filteredValue = value
                                    .replace(/[^0-9.]/g, '') // Allow only numbers and dots
                                    .replace(/(\..*?)\..*/g, '$1'); // Remove additional dots

                                // Prevent NaN if only "." is entered
                                if (filteredValue === '.') {
                                    filteredValue = '0.';
                                }
                                if (allowOneDecimalOnly) {
                                    filteredValue = filteredValue.replace(/(\.\d{1})\d+/, '$1');
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
                            if (allowAlphabetsAndNumbersOnly) {
                                filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
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
                            if (allowUpperCaseOnly) {
                                filteredValue = value.toUpperCase();
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
                            if (allowAddressFormat) {
                                filteredValue = value.replace(/[^a-zA-Z0-9 ,-]/g, '');
                            }
                            if (allowBeneficiaryNameFormat) {
                                filteredValue = value.replace(/[^a-zA-Z0-9@&_\-./: ]/g, '');
                            }
                            if (allowAddressFormat) {
                                filteredValue = value.replace(/[^a-zA-Z0-9 ,-]/g, '');
                            }
                            setFieldValue(name, filteredValue);
                            if (handleChange) handleChange(filteredValue);
                        }}
                    />
                </Form.Item>
            );
        }}
        </Field>
    );
};

export default TextInput;
