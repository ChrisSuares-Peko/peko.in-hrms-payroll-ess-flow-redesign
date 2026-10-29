import { Col, Flex, Typography } from 'antd';

import { formatDurationToHourMinute } from '../utils/formatDateCode';

interface Props {
    duration: number;
}
const FlightDurationBadge = ({ duration }: Props) => (
    <Flex className="w-full" align="center" justify="center">
        <Col className="h-2 w-4 rounded-full bg-[#D9BFEF] text-transparent" />
        <Col className="text-[#D9BFEF] w-2/5" style={{ borderTop: '.5px dashed' }} />
        <Flex className="bg-[#F6EEFB] w-fit rounded-full" align="center" justify="center">
            <Typography.Text className="text-gray-800 font-medium w-28 text-center ">
                {formatDurationToHourMinute(duration)}
            </Typography.Text>
        </Flex>
        <Col className="text-[#D9BFEF] w-2/5" style={{ borderTop: '.5px dashed' }} />
        <Col className="h-2 w-4 rounded-full bg-[#D9BFEF] text-transparent" />
    </Flex>
);

export default FlightDurationBadge;
