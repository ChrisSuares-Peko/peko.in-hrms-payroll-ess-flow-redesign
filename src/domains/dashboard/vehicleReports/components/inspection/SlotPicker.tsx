import { Flex } from 'antd';
import dayjs from 'dayjs';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import TimePickerInput from '@components/atomic/inputs/TimePickerInput';

interface Props {
    // 1-based slot number; composes the flat field names slot1Date / slot1Time.
    index: 1 | 2;
    isRequired?: boolean;
}

// One preferred appointment slot. Field names are flat rather than `slots[0].date`
// because TimePickerInput reads touched[name]/errors[name] and cannot resolve
// nested paths. Date and time are separate inputs, matching the design — and this
// also avoids DatePickerInput's showTime branch, which hard-codes a 10:00–15:00
// window and blocks Sundays.
const SlotPicker = ({ index, isRequired }: Props) => (
    <Flex vertical gap={10}>
        <span className="w-fit rounded bg-[#F2F4F7] px-2 py-[3px] text-xs text-[#475569]">
            {`Slot ${index}`}
        </span>
        <Flex gap={24} className="flex-col md:flex-row">
            <div className="flex-1">
                <DatePickerInput
                    name={`slot${index}Date`}
                    label="Date"
                    placeholder="Select a date"
                    size="large"
                    isRequired={isRequired}
                    minDate={dayjs().add(1, 'day')}
                    classes="w-full"
                />
            </div>
            <div className="flex-1">
                <TimePickerInput
                    name={`slot${index}Time`}
                    label="Time"
                    placeholder="Select a time"
                    size="large"
                    isRequired={isRequired}
                />
            </div>
        </Flex>
    </Flex>
);

export default SlotPicker;
