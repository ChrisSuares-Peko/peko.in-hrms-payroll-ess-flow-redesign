import { Divider, Flex, Typography } from 'antd';

type Props = {
    date: string;
    // location: string;
    description: string;
};

const TrackingUpdate = ({ date, description }: Props) => (
    <Flex vertical gap={10}>
        <Typography.Text className="text-textGreenTitle text-base font-medium">
            {date}
        </Typography.Text>
        {/* <Typography.Text className="text-textGrey text-sm ">{location}</Typography.Text> */}
        <Typography.Paragraph className="w-full sm:w-9/12 text-sm">
            {description}
        </Typography.Paragraph>
        <Divider />
    </Flex>
);
export default TrackingUpdate;
