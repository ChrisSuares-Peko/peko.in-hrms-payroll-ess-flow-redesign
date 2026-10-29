import { Col, Flex, Typography } from 'antd';

import { formatDurationToHourMinute } from '../../utils/formatDateCode';

interface Props {
    duration: number;
}
const FlightDurationBadgeSmall = ({ duration }: Props) => (
    <Flex className="w-full" align="center" justify="center">
        <Col className="h-2 w-4 rounded-full bg-red-500 text-transparent" />
        <Col className="text-bgOrange2 w-2/5" style={{ borderTop: '.5px dashed' }} />
        <Flex className="bg-tagColor w-fit rounded-full" align="center" justify="center">
            <Typography.Text className="text-red-500 font-medium w-20 text-center text-[12px] ">
                {formatDurationToHourMinute(duration)}
            </Typography.Text>
        </Flex>
        <Col className="text-bgOrange2 w-2/5" style={{ borderTop: '.5px dashed' }} />
        <Col className="h-2 w-4 rounded-full bg-red-500 text-transparent" />
    </Flex>
);

export default FlightDurationBadgeSmall;
