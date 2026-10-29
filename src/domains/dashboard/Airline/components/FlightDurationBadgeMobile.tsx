import { Col, Flex, Typography } from 'antd';

import { formatDurationToHourMinute } from '../utils/formatDateCode';

interface Props {
    duration: number;
}

const FlightDurationBadgeMobile = ({ duration }: Props) => (
    <Flex
        className="md:w-full sm:w-auto xs:w-auto mt-9"
        align="center"
        justify="center"
        style={{ gap: '4px', position: 'relative' }}
    >
        <Flex align="center" justify="center" style={{ position: 'absolute', top: '-12px' }}>
            <Typography.Text className="text-red-500 font-medium text-[.5rem] text-center">
                {formatDurationToHourMinute(duration)}
            </Typography.Text>
        </Flex>
        <Col
            style={{
                height: '6px',
                width: '6px',
                backgroundColor: 'red',
                borderRadius: '50%',
            }}
            className="h-1 w-1 rounded-full bg-red-500 text-transparent"
        />

        <Col className="text-bgOrange2 w-1/6" style={{ borderTop: '.5px dashed' }} />

        <Col className="text-bgOrange2 w-1/6" style={{ borderTop: '.5px dashed' }} />

        <Col
            style={{
                height: '6px',
                width: '6px',
                backgroundColor: 'red',
                borderRadius: '50%',
            }}
            className="h-1 w-1 rounded-full bg-red-500 text-transparent"
        />
    </Flex>
);

export default FlightDurationBadgeMobile;
