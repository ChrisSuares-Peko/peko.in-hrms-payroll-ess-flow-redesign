import React, { ReactNode } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { DatePicker, DatePickerProps, Form } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import dayjs, { Dayjs } from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { Field, FieldProps, useFormikContext, getIn } from 'formik';

import { getDefaultPickerValue } from '@utils/globalComponents';

dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);

interface DatePickerInputProps {
    name: string;
    label?: string | ReactNode;
    placeholder: string;
    size?: SizeType;
    formItemClass?: string;
    isDisabled?: boolean;
    isRequired?: boolean;
    classes?: string;
    style?: React.CSSProperties;
    showToolTip?: boolean;
    tooltipText?: string;
    minDate?: Dayjs;
    maxDate?: Dayjs;
    showTime?: boolean;
    needConfirm?: boolean;
    handleChange?: (value: string | string[]) => void;
    inputReadOnly?: boolean;
    autoComplete?: 'on' | 'off';
    allowClear?: boolean;
    format?: string;
    disabledDate?: (current: Dayjs) => boolean;
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
    formItemClass,
    minDate,
    maxDate,
    showTime = false,
    needConfirm = true,
    allowClear = true,
    handleChange,
    inputReadOnly = true,
    autoComplete = 'on',
    style,
    format = 'YYYY-MM-DD',
    disabledDate: disabledDateProp,
}) => {
    const { setFieldValue, values } = useFormikContext<any>();

    const onChange: DatePickerProps['onChange'] = (date, dateString) => {
        setFieldValue(name, dateString);
        if (handleChange) handleChange(dateString);
    };

    const disabledDate: DatePickerProps<Dayjs>['disabledDate'] = current => current?.day() === 0;
    const fieldValue = getIn(values, name);
    const parsedValue = fieldValue ? dayjs(fieldValue, format) : null;
    const datePickerValue = parsedValue && parsedValue.isValid() ? parsedValue : undefined;
    const defaultPickerValue =
        datePickerValue ?? getDefaultPickerValue(minDate, maxDate || undefined);

    return (
        <Field name={name}>
            {({ field, form: { touched, errors } }: FieldProps) => (
                <Form.Item
                    label={label && <span title="">{label}</span>}
                    required={isRequired}
                    validateStatus={getIn(touched, name) && getIn(errors, name) ? 'error' : ''}
                    help={
                        getIn(touched, name) && getIn(errors, name)
                            ? (getIn(errors, name) as React.ReactNode)
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
                    <DatePicker
                        value={datePickerValue}
                        defaultPickerValue={defaultPickerValue}
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
                        disabledDate={disabledDateProp ?? (minDate && maxDate && showTime ? disabledDate : undefined)}
                        placeholder={placeholder}
                        disabled={isDisabled}
                        className={classes}
                        style={{ width: '100%', ...style }}
                        size={size}
                        format={format}
                        onChange={onChange}
                        onKeyDown={e => e.preventDefault()}
                        minDate={minDate}
                        maxDate={maxDate}
                        needConfirm={needConfirm}
                        allowClear={allowClear}
                        autoComplete={autoComplete}
                        inputReadOnly={inputReadOnly}
                    />
                </Form.Item>
            )}
        </Field>
    );
};

export default DatePickerInput;
