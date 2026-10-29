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
    value?: Dayjs;
    defaultValue?: Dayjs;
    onDateChange?: (date: Dayjs) => void;
}

const DatePickerInput: React.FC<DatePickerInputProps> = ({
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
    onDateChange,
    value,
    defaultValue,
}) => {
    const { setFieldValue, values } = useFormikContext<any>();

    const onChange: DatePickerProps['onChange'] = (date, dateString) => {
        setFieldValue(name, dateString);
        if (onDateChange && date) {
            onDateChange(date as Dayjs);
        }
    };

    const disabledDate: DatePickerProps<Dayjs>['disabledDate'] = current => current?.day() === 0;

    return (
        <Field name={name}>
            {({ field, form: { touched, errors } }: FieldProps) => (
                <Form.Item
                    label={label && <span title="">{label}</span>}
                    required={isRequired}
                    validateStatus={touched[name] && errors[name] ? 'error' : ''}
                    help={
                        touched[name] && errors[name]
                            ? (errors[name] as React.ReactNode)
                            : undefined
                    }
                    tooltip={
                        showToolTip && {
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
                        }
                    }
                >
                    <DatePicker
                        // value={
                        //     values[name] !== null ||
                        //     values[name] !== undefined ||
                        //     values[name] !== ''
                        //         ? dayjs(values[name], 'YYYY/MM/DD')
                        //         : dayjs()
                        // }
                        defaultValue={defaultValue}
                        showTime={
                            showTime
                                ? {
                                      hideDisabledOptions: true,
                                      defaultValue: dayjs('00:00:00', 'HH:mm:ss'),
                                      format: 'HH:mm',
                                      disabledHours: () =>
                                          Array.from({ length: 24 }, (_, i) => i).filter(
                                              hour => hour < 10 || hour > 15
                                          ),
                                      disabledMinutes: selectedHour => {
                                          if (selectedHour < 10 || selectedHour > 15) {
                                              return Array.from({ length: 60 }, (_, i) => i);
                                          }
                                          return [];
                                      },
                                  }
                                : false
                        }
                        disabledDate={minDate && maxDate && showTime ? disabledDate : undefined}
                        placeholder={placeholder}
                        disabled={isDisabled}
                        className={classes}
                        size={size}
                        onChange={onChange}
                        minDate={minDate}
                        maxDate={maxDate}
                        value={values[name] ? dayjs(values[name]) : undefined}
                        allowClear
                        inputReadOnly
                    />
                </Form.Item>
            )}
        </Field>
    );
};

export default DatePickerInput;
