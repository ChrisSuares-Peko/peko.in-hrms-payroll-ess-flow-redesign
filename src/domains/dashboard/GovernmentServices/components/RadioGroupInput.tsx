import React from 'react';

import { Form, Radio } from 'antd';
import { Field, FieldProps, getIn } from 'formik';
import { twMerge } from 'tailwind-merge';

interface Option {
    label: string;
    value: string;
}

interface RadioGroupInputProps {
    name: string;
    label?: string;
    options: Option[];
    isRequired?: boolean;
    isDisabled?: boolean;
    classes?: string;
    formItemClass?: string;
}

const RadioGroupInput: React.FC<RadioGroupInputProps> = ({
    name,
    label,
    options,
    isRequired,
    isDisabled,
    classes,
    formItemClass,
}) => (
    <Field name={name}>
        {({ field, form: { touched, errors, setFieldValue } }: FieldProps) => (
            <Form.Item
                label={label && <span title="">{label}</span>}
                colon={false}
                required={isRequired}
                validateStatus={getIn(touched, name) && getIn(errors, name) ? 'error' : ''}
                help={
                    getIn(touched, name) && getIn(errors, name)
                        ? (getIn(errors, name) as React.ReactNode)
                        : undefined
                }
                className={formItemClass}
            >
                <Radio.Group
                    value={field.value}
                    disabled={isDisabled}
                    onChange={e => setFieldValue(name, e.target.value)}
                    className={twMerge('w-full flex gap-3', classes)}
                >
                    {options.map(opt => (
                        <Radio
                            key={opt.value}
                            value={opt.value}
                            className="m-0"
                        >
                            {opt.label}
                        </Radio>
                    ))}
                </Radio.Group>
            </Form.Item>
        )}
    </Field>
);

export default RadioGroupInput;
