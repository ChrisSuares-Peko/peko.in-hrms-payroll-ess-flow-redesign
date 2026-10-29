import { Flex, Statistic, Typography } from 'antd';
import CountUp from 'react-countup';
import { ReactSVG } from 'react-svg';

type Props = {
    bgColor: string;
    title: string;
    amount: any;
    icon: string;
    isTons?: boolean;
};

const { Text } = Typography;
const formatter = (value: any) => (
    <CountUp end={value} separator="," decimals={value % 1 !== 0 ? 2 : 0} />
);
const DashboardCarbonCard = ({ bgColor, title, amount, icon, isTons = false }: Props) => (
    <Flex vertical className={`${bgColor} rounded-2xl px-5 py-4  xs:hidden md:block `}>
        <Flex vertical className="ml-2" gap={12}>
            <Flex className="w-10 h-10 bg-white rounded-full" align="center" justify="center">
                <ReactSVG src={icon} />
            </Flex>
            <Flex vertical gap={7}>
                <Text className=" text-sm">{title}</Text>
                <Flex align="baseline" gap={3}>
                    <Text ellipsis className={` text-black text-opacity-90 text-xl font-medium`}>
                        <Statistic value={amount} formatter={formatter} precision={2} />
                    </Text>
                    {isTons && (
                        <Text className=" text-black text-opacity-90 xl:text-xs text-sm xxl-text-sm font-normal">
                            tons CO₂
                        </Text>
                    )}
                </Flex>
            </Flex>
        </Flex>
    </Flex>
);

export default DashboardCarbonCard;
