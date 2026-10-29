import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { DatePicker, DatePickerProps, Form } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import dayjs, { Dayjs } from 'dayjs';
import { Field, FieldProps, useFormikContext } from 'formik';

interface DatePickerInputProps {
    name: string;
    label?: string;
    placeholder: string;
    size?: SizeType;
    isDisabled?: boolean;
    isRequired?: boolean;
    classes?: string;
    showToolTip?: boolean;
    tooltipText?: string;
    minDate?: Dayjs;
    maxDate?: Dayjs;
    showTime?: boolean;
    needConfirm?: boolean;
    handleChange?: (value: string | string[]) => void;
}

const MonthPickerInput: React.FC<DatePickerInputProps> = ({
    name,
    label,
    placeholder,
    size = 'middle',
    isDisabled,
    isRequired,
    classes,
    showToolTip = false,
    tooltipText,
    minDate,
    maxDate,
    showTime = false,
    needConfirm = true,
    handleChange,
}) => {
    const { setFieldValue, values } = useFormikContext<any>();

    const onChange: DatePickerProps['onChange'] = (date, dateString) => {
        setFieldValue(name, dateString);
        if (handleChange) handleChange(dateString);
    };

    const disabledDate: DatePickerProps<Dayjs>['disabledDate'] = current => current?.day() === 0;
    const datePickerValue = values[name] ? dayjs(values[name], 'YYYY-MM') : undefined;

    return (
        <Field name={name}>
            {({ field, form: { touched, errors } }: FieldProps) => (
                <Form.Item
                    label={label}
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
                >
                    <DatePicker.MonthPicker
                        value={datePickerValue}
                        disabledDate={minDate && maxDate && showTime ? disabledDate : undefined}
                        placeholder={placeholder}
                        disabled={isDisabled}
                        className={classes}
                        size={size}
                        onChange={onChange}
                        minDate={minDate}
                        maxDate={maxDate}
                        needConfirm={needConfirm}
                        allowClear
                    />
                </Form.Item>
            )}
        </Field>
    );
};

export default MonthPickerInput;
