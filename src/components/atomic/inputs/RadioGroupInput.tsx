import React from 'react';

import { Form, Radio } from 'antd';
import { Field, FieldProps, getIn } from 'formik';
import { twMerge } from 'tailwind-merge';

interface Option {
    label: string;
    value: string | boolean;
}

const hideRadioClass =
    '[&_.ant-radio]:!hidden [&_.ant-radio+span]:!pl-0 [&_.ant-radio-wrapper]:flex-1 [&_.ant-radio-wrapper]:justify-center [&_.ant-radio-wrapper]:items-center [&_.ant-radio-wrapper]:border [&_.ant-radio-wrapper]:rounded-lg [&_.ant-radio-wrapper]:text-sm [&_.ant-radio-wrapper]:border-[#E4E4E7] [&_.ant-radio-wrapper-checked]:!border-[#FF4F4F] [&_.ant-radio-wrapper-checked]:!bg-[#FFF1F2] [&_.ant-radio-wrapper-checked>span:last-child]:!text-[#FF4F4F]';

interface RadioGroupInputProps {
    name: string;
    label?: string;
    options: Option[];
    isRequired?: boolean;
    isDisabled?: boolean;
    classes?: string;
    formItemClass?: string;
    simple?: boolean;
    hideRadio?: boolean;
}

const RadioGroupInput: React.FC<RadioGroupInputProps> = ({
    name,
    label,
    options,
    isRequired,
    isDisabled,
    classes,
    formItemClass,
    simple,
    hideRadio,
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
                    className={twMerge("flex gap-3 w-full", hideRadio && hideRadioClass, classes)}
                >
                    {options.map(opt => (
                        <Radio
                            key={String(opt.value)}
                            value={opt.value}
                            className={
                                simple
                                    ? undefined
                                    : 'flex-1 border border-[#d9d9d9] rounded-lg px-3 py-2 m-0 [&_.ant-radio]:shrink-0'
                            }
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
