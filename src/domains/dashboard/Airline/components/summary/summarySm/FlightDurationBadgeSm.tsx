import { Col, Flex, Typography } from 'antd';

import { formatDurationToHourMinute } from '../../../utils/formatDateCode';

interface Props {
    duration: number;
}
const FlightDurationBadgeSm = ({ duration }: Props) => {
    const { Text } = Typography;
    return (
        <Flex className="md:w-full sm:w-auto xs:w-auto mt-16" align="center" justify="center">
            <Col className="h-1 w-2 rounded-full bg-red-500 text-transparent" />
            <Col className="text-bgOrange2 w-2/5" style={{ borderTop: '.3px dashed' }} />
            <Flex
                className="bg-tagColor md:w-fit sm:w-10 rounded-full"
                align="center"
                justify="center"
            >
                <Text className="text-red-500 font-base w-20  text-center ">
                    {formatDurationToHourMinute(duration)}
                </Text>
            </Flex>
            <Col className="text-bgOrange2 w-2/5" style={{ borderTop: '.5px dashed' }} />
            <Col className="h-2 w-4 rounded-full bg-red-500 text-transparent" />
        </Flex>
    );
};

export default FlightDurationBadgeSm;
