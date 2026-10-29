import React from 'react';

import { Form, Input } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { Field, FieldProps } from 'formik';

interface PasswordInputProps {
    name: string;
    label?: string;
    placeholder: string;
    type: string;
    size?: SizeType;
    isDisabled?: boolean;
    isRequired?: boolean;
    disablePaste?: boolean;
    classes?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    allowAllExceptSpace?: boolean;
    maxLength?: number;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
    name,
    label,
    placeholder,
    type,
    size,
    isDisabled,
    isRequired,
    classes,
    disablePaste = false,
    onChange,
    allowAllExceptSpace,
    maxLength,
}) => {
    const { Password } = Input;
    return (
        <Field name={name}>
            {({ field, form: { touched, errors, setFieldValue } }: FieldProps) => (
                <Form.Item
                    label={label}
                    required={isRequired}
                    validateStatus={touched[name] && errors[name] ? 'error' : ''}
                    help={
                        touched[name] && errors[name]
                            ? (errors[name] as React.ReactNode)
                            : undefined
                    }
                >
                    <Password
                        {...field}
                        type={type}
                        size={size ?? 'middle'}
                        placeholder={placeholder}
                        disabled={isDisabled}
                        className={classes}
                        maxLength={maxLength}
                        onPaste={e => {
                            if (disablePaste) e.preventDefault();
                        }}
                        onChange={e => {
                            const { value } = e.target;
                            let filteredValue = value;
                            if (allowAllExceptSpace) {
                                filteredValue = value.replace(/ /g, '');
                            }
                            setFieldValue(name, filteredValue);
                            if (onChange) onChange(e); // Custom onChange handler
                        }}
                    />
                </Form.Item>
            )}
        </Field>
    );
};

export default PasswordInput;
