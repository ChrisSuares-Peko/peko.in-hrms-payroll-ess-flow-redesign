import { Flex, Typography, Image, Statistic } from 'antd';
import CountUp from 'react-countup';

import totalCommunityIcon from '@domains/dashboard/carbonFootprint/assets/images/totalCommunity.png';
import useScreenSize from '@src/hooks/useScreenSize';

const { Text } = Typography;

type Props = {
    totalCommunity: string | undefined;
};
const formatter = (value: any) => (
    <CountUp end={value} separator="," decimals={value % 1 !== 0 ? 2 : 2} />
);
const NeutralizedCard = ({ totalCommunity }: Props) => {
    const { md, lg, xxl } = useScreenSize();

    const gap = md ? 15 : 10;
    return (
        <Flex className="grey-gradient rounded-2xl flex justify-center self-center align-middle h-full py-5 ">
            <Flex
                vertical
                justify="center"
                align="center"
                gap={gap}
                className="border border-solid md:border-none w-50  rounded-xl"
            >
                <Image
                    src={totalCommunityIcon}
                    preview={false}
                    loading="lazy"
                    width="20%"
                    className="xs:block lg:hidden "
                />
                <Text className=" text-center text-black md:text-sm xxl:text-lg xl:px-2 xxl:px-5 text-xs  xl:w-3/4 xxl:w-3/5  font-normal">
                    Total CO₂ neutralized by Ared Community
                </Text>
                {lg && (
                    <Image
                        src={totalCommunityIcon}
                        preview={false}
                        loading="lazy"
                        width={xxl ? '30%' : '40%'}
                    />
                )}

                <Flex align="baseline" justify="center" gap={10}>
                    <Text className="  text-center text-md md:text-4xl lg:text-2xl xl:text-3xl font-medium">
                        <Statistic
                            valueStyle={{ color: 'rgba(4, 232, 120, 1)', fontSize: '2.2rem' }}
                            value={totalCommunity}
                            formatter={formatter}
                            precision={2}
                        />
                    </Text>
                    <Text className="text-center text-black text-md font-normal text-sm">
                        tons CO₂
                    </Text>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default NeutralizedCard;
