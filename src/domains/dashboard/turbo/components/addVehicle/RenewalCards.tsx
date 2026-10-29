import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

const { Text } = Typography;

const RenewalCards = ({ icon, title, renewalDate, subText, bgColor }: any) => (
        <Flex
            vertical
            // ref={reference}
            className={`${bgColor} rounded-2xl py-3 xxl:py-5 px-5 flex-1 `}
            gap={16}
        >
            <Flex className="rounded-full" gap={4}>
                <ReactSVG src={icon} data-testid="icon-svg" />
                <Text className="  ">{title}</Text>
            </Flex>
            <Flex vertical gap={3} className="">
                <Text className="text-xs -mt-2 text-gray-400 ">Renewal on</Text>

                <Text className="font-medium text-lg mt-1">{renewalDate}</Text>
            </Flex>
        </Flex>
    );

export default RenewalCards;
