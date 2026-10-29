import React from 'react';

import { Form, TimePicker } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import dayjs from 'dayjs';
import { Field, FieldProps } from 'formik';

interface TimePickerInputProps {
    name: string;
    label?: string;
    placeholder?: string;
    size?: SizeType;
    isDisabled?: boolean;
    isRequired?: boolean;
    classes?: string;
}

const TimePickerInput: React.FC<TimePickerInputProps> = ({
    name,
    label,
    placeholder = 'Select time',
    size = 'middle',
    isDisabled,
    isRequired,
    classes,
}) => (
    <Field name={name}>
        {({ form: { touched, errors, setFieldValue, values } }: FieldProps) => (
            <Form.Item
                label={label && <span title="">{label}</span>}
                colon={false}
                required={isRequired}
                validateStatus={touched[name] && errors[name] ? 'error' : ''}
                help={
                    touched[name] && errors[name]
                        ? (errors[name] as React.ReactNode)
                        : undefined
                }
            >
                <TimePicker
                    value={values[name] ? dayjs(values[name], 'HH:mm') : undefined}
                    format="hh:mm A"
                    use12Hours
                    minuteStep={30}
                    placeholder={placeholder}
                    disabled={isDisabled}
                    className={`w-full ${classes ?? ''}`}
                    size={size}
                    onChange={(_, timeString) => {
                        setFieldValue(name, timeString as string);
                    }}
                    allowClear
                />
            </Form.Item>
        )}
    </Field>
);

export default TimePickerInput;
