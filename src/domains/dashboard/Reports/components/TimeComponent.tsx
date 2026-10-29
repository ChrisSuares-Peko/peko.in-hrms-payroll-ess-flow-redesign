import { memo } from 'react';

import { Flex, Select, TimePicker, Typography } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { weekDay } from '../utils/data';


dayjs.extend(customParseFormat);


const { Text } = Typography;
type Props = {
    timeVal: string | false | undefined;
    handleTimeChange: (time: any, timeStrings: any) => void;
    week?: boolean;
    handleWeekChange: (selectedOption: string) => void;
    WeekVal: string | false | undefined;
};

const TimeComponent = ({ timeVal, handleTimeChange, week, handleWeekChange, WeekVal }: Props) => (
    <Flex justify="space-between" className="flex-col sm:flex-row">
        {week && (
            <Flex vertical gap={10}>
                <Text className="text-normal ">Pick Week Day </Text>

                <Select
                    defaultValue={WeekVal || weekDay[0].value}
                    options={weekDay}
                    className="w-full"
                    onChange={handleWeekChange}
                />
            </Flex>
        )}
        <Flex vertical gap={10}>
            <Text className="text-normal mt-2">Pick Time</Text>
            <TimePicker
                value={timeVal ? dayjs(timeVal, 'HH:mm') : undefined}
                className="w-full"
                format="HH:mm"
                direction="rtl"
                onChange={handleTimeChange}
            />
        </Flex>
    </Flex>
);

export default memo(TimeComponent);
