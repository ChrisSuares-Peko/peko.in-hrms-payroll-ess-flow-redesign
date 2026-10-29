import { Flex, Statistic, Typography } from 'antd';
import CountUp from 'react-countup';
import { ReactSVG } from 'react-svg';

import { InfoCardProps } from '@domains/dashboard/Payroll/types/types';

const formatter = (value: any, isCurrency: any) => (
    <CountUp end={value} separator="," decimals={isCurrency ? 2 : 0} />
);
const InfoCard = ({ icon, title, value, isCurrency, bgColor, reference, outOf }: InfoCardProps) => (
    <Flex
        ref={reference}
        vertical
        justify="center"
        className={`${bgColor} w-full min-h-[131px] rounded-[22px] px-5 py-4 shadow-sm`}
        gap={6}
    >
        <Flex
            className="h-9 w-9 shrink-0 rounded-full bg-white text-black"
            align="center"
            justify="center"
        >
            <ReactSVG src={icon} />
        </Flex>

        <Typography.Text className="text-sm font-normal leading-5 text-[#333333]">
            {title}
        </Typography.Text>

        {isCurrency ? (
            <Flex gap={3} align="baseline" className="text-[#101010]">
                <Typography.Text ellipsis className="text-2xl font-semibold leading-7">
                    ₹
                </Typography.Text>

                <Typography.Text
                    ellipsis
                    className="whitespace-nowrap text-2xl font-semibold leading-7 tracking-[-0.02em] text-[#101010]"
                >
                    <Statistic
                        value={Number(value)?.toFixed(0)}
                        formatter={() => formatter(value, isCurrency)}
                        precision={2}
                        className="payroll-dashboard"
                        valueStyle={{ fontSize: 24, lineHeight: '28px' }}
                    />
                </Typography.Text>
            </Flex>
        ) : (
            <Flex align="baseline" gap={4}>
                <Typography.Text
                    ellipsis
                    className="whitespace-nowrap text-2xl font-semibold leading-7 tracking-[-0.02em] text-[#101010]"
                >
                    <Statistic
                        className="payroll-dashboard"
                        value={Number(value)}
                        formatter={() => formatter(value, isCurrency)}
                        precision={0}
                        valueStyle={{ fontSize: 24, lineHeight: '28px' }}
                    />
                </Typography.Text>
                {outOf !== undefined && (
                    <Typography.Text className="text-sm font-normal text-[#666666]">
                        out of {outOf}
                    </Typography.Text>
                )}
            </Flex>
        )}
    </Flex>
);

export default InfoCard;
