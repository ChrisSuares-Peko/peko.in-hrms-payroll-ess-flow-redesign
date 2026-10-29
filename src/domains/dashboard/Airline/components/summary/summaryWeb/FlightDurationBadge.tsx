import { Col, Flex, Typography } from 'antd';

import { formatDurationToHourMinute } from '../../../utils/formatDateCode';

interface Props {
    duration: number;
}
const FlightDurationBadge = ({ duration }: Props) => (
    <Flex className="md:w-full sm:w-auto xs:w-auto" align="center" justify="center">
        <Col className="h-2 w-4 rounded-full bg-red-500 text-transparent" />
        <Col className="text-bgOrange2 w-2/5" style={{ borderTop: '.5px dashed' }} />
        <Flex className="bg-tagColor md:w-fit sm:w-10 rounded-full" align="center" justify="center">
            <Typography.Text className="text-red-500 font-medium w-28  text-center ">
                {formatDurationToHourMinute(duration)}
            </Typography.Text>
        </Flex>
        <Col className="text-bgOrange2 w-2/5" style={{ borderTop: '.5px dashed' }} />
        <Col className="h-2 w-4 rounded-full bg-red-500 text-transparent" />
    </Flex>
);

export default FlightDurationBadge;
