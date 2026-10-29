import React from 'react';

import { Form, Input } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { Field, FieldProps, getIn } from 'formik';

import useScreenSize from '@src/hooks/useScreenSize';

interface TextAreaProps {
    name: string;
    label?: string;
    placeholder: string;
    size?: SizeType;
    isDisabled?: boolean;
    isRequired?: boolean;
    maxLength?: number;
    minLength?: number;
    minRows?: number;
    showCount?: boolean;
    removeEmoji?: boolean;
    allowedCharacters?: string;
}

const removeEmojis = (str: string) =>
    str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');

const TextAreaInput: React.FC<TextAreaProps> = ({
    name,
    label,
    placeholder,
    size,
    isDisabled,
    isRequired,
    maxLength,
    minLength,
    minRows = 2,
    showCount = false,
    removeEmoji = true,
    allowedCharacters,
}) => {
    const { sm } = useScreenSize();
    return (
        <Field name={name}>
            {({ field, form: { touched, errors, setFieldValue } }: FieldProps) => (
                <Form.Item
                    label={label}
                    required={isRequired}
                    validateStatus={getIn(touched, name) && getIn(errors, name) ? 'error' : ''}
                    help={getIn(touched, name) && getIn(errors, name) ? (getIn(errors, name) as React.ReactNode) : undefined}
                >
                    <Input.TextArea
                        {...field}
                        id={name}
                        size={size ?? 'middle'}
                        placeholder={placeholder}
                        disabled={isDisabled}
                        maxLength={maxLength}
                        minLength={minLength}
                        autoSize={{ minRows }}
                        showCount={sm && showCount}
                        onChange={e => {
                            let value = removeEmoji ? removeEmojis(e.target.value) : e.target.value;
                            if (allowedCharacters) {
                                const regex = new RegExp(`[^${allowedCharacters}]`, 'g');
                                value = value.replace(regex, '');
                            }
                            setFieldValue(name, value);
                        }}
                    />
                </Form.Item>
            )}
        </Field>
    );
};

export default TextAreaInput;
