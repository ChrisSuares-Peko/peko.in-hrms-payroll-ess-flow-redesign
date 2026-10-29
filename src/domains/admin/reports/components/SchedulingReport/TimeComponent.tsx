import React from 'react';

import { Flex, Select, TimePicker, Typography } from 'antd';
import dayjs from 'dayjs';

import { weekDay } from '../../utils/data';

type Props = {
    timeVal: string | false | undefined;
    handleTimeChange: (time: any, timeStrings: any) => void;
    week?: boolean;
    handleWeekChange: (selectedOption: string) => void;
    WeekVal: string | false | undefined;
    disabled?: boolean
};

const TimeComponent = ({ timeVal, handleTimeChange, week, handleWeekChange, WeekVal, disabled}: Props) => (
    <Flex justify="space-between" align="center">
        {week && (
            <Flex vertical gap={10}>
                <Typography.Text className="text-normal ">Pick Week Day </Typography.Text>

                <Select
                    defaultValue={WeekVal || weekDay[0].value}
                    options={weekDay}
                    className="w-full"
                    onChange={handleWeekChange}
                    disabled={disabled}
                />
            </Flex>
        )}
        <Flex vertical gap={10}>
            <Typography.Text className="text-normal mt-2">Pick Time</Typography.Text>
            <TimePicker
                value={timeVal ? dayjs(timeVal, 'HH:mm') : undefined}
                className="w-full"
                format="HH:mm"
                direction="rtl"
                onChange={handleTimeChange}
                disabled={disabled}
            />
        </Flex>
    </Flex>
);

export default TimeComponent;
