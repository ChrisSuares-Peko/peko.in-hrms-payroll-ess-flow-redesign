import { Flex, Typography } from 'antd';

import { formatDurationToHourMinute } from '../../utils/formatDateCode';

interface Props {
    duration: number;
}
const DurationBadgeSm = ({ duration }: Props) => {
    const { Text } = Typography;
    return (
        <Flex className="md:w-full sm:w-auto xs:w-auto mt-12" align="center" justify="center">
            <Flex
                className="bg-[#F5F5F5] md:w-fit sm:w-10 rounded-full"
                align="center"
                justify="center"
            >
                <Text className="text-[#595959] font-[600] w-20 text-[0.7rem]  text-center ">
                    {formatDurationToHourMinute(duration)}
                </Text>
            </Flex>
        </Flex>
    );
};

export default DurationBadgeSm;
