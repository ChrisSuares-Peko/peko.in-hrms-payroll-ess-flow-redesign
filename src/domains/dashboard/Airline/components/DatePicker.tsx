import React, { CSSProperties, useEffect, useState } from 'react';

import '../assets/style.css';

import { DatePicker, DatePickerProps, Space } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import moment from 'moment';

dayjs.extend(customParseFormat);

interface DateProps {
    style?: CSSProperties;
    defaultDate?: string;
    dateData: any;
    disabledData?: boolean;
    placeholder?: string;
    disabledDate?: (current: any) => boolean;
    handleChange?: ((date: any, dates: string | string[]) => void) | undefined;
    handleOpenChange?: () => void;
    defaultPickerValue?: Dayjs;
}

const Date: React.FC<DateProps> = ({
    dateData,
    style,
    disabledData,
    defaultDate,
    placeholder = 'Select Date',
    disabledDate = (current: any) => current && current < moment().startOf('day'),
    handleChange,
    handleOpenChange,
    defaultPickerValue,
}) => {
    const [selectedDate, setSelectedDate] = useState<DatePickerProps['value'] | null>(null);

    const onChange: DatePickerProps['onChange'] = (date, dateString) => {
        if (date) {
            setSelectedDate(date);
            const formattedDate = date.format('DD-MM-YYYY');
            const dayOfWeek = date.format('dddd');
            dateData({
                date: formattedDate,
                day: dayOfWeek,
            });
            if (handleChange) handleChange(date, dateString);
        }
    };

    const OpenChange = (value: boolean) => {
        if (handleOpenChange) handleOpenChange();
    };

    useEffect(() => {
        if (defaultDate) {
            setSelectedDate(dayjs(defaultDate, 'DD MM YYYY'));
        }
    }, [defaultDate]);

    return (
        <Space>
            <DatePicker
                value={selectedDate}
                format="DD MMM YYYY"
                disabled={disabledData}
                disabledDate={disabledDate}
                placement="bottomLeft"
                style={style}
                placeholder={placeholder}
                suffixIcon={false}
                onChange={onChange}
                allowClear={false}
                className="w-full custom_datepicker"
                popupClassName="custom_datepicker_popup"
                onOpenChange={OpenChange}
                defaultPickerValue={defaultPickerValue}
                inputReadOnly
            />
        </Space>
    );
};

export default Date;
