import { Flex, Image, Statistic, Typography } from 'antd';
import CountUp from 'react-countup';

import { ReminderCardProps } from '../../types/dash/index';
import { fetchDocIcon } from '../../utils/dashDetails';

const formatter = (value: any) => (
    <CountUp end={value} separator="," decimals={value % 1 !== 0 ? 0 : 0} />
);

const ReminderCard = ({ icon, title, subTitle, type, date }: ReminderCardProps) => {
    function daysUntil(dateStr: string): number {
        const futureDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = +futureDate - +today;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    }
    const DocTypeIcon = fetchDocIcon(type);
    return (
        <Flex vertical className="bg-[#FAFAFA] rounded-xl p-5 flex-1 w-full" gap={2}>
            <Flex
                className="w-7 h-7 xs:bg-red-50 md:bg-white rounded-md"
                align="center"
                justify="center"
            >
                <Image width={35} preview={false} src={DocTypeIcon} />
            </Flex>

            <Flex align="baseline" justify="start" className="pl-1">
                <Typography.Text className="text-base font-semibold sm:text-sm  whitespace-nowrap">
                    <Statistic
                        value={Number(daysUntil(date))?.toFixed(0)}
                        formatter={formatter}
                        precision={0}
                        className="payroll-dashboard"
                    />
                </Typography.Text>
                <Typography.Text className={` text-xs font-normal `}>
                    &nbsp; Days Left
                </Typography.Text>
            </Flex>
            <Typography.Text className=" text-[0.7rem] font-normal truncate">
                {title}
            </Typography.Text>
            <Typography.Text className=" text-[0.6rem] text-gray-400 truncate">
                {subTitle}
            </Typography.Text>
        </Flex>
    );
};

export default ReminderCard;
