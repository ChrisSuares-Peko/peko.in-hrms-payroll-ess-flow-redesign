import { Card, Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

const { Text } = Typography;

type CardProps = {
    img: string;
    title: string;
    value: string;
};

const CustomCard = ({ img, title, value }: CardProps) => (
    <Card className="w-full min-h-40 rounded-xl border-0 bg-impactReportCardBg flex justify-center self-center align-middle">
        <Flex align="center" justify="center" vertical className="h-full" gap={6}>
            <ReactSVG src={img} />
            <Text className="text-xs mt-2 text-center">{title}</Text>
            <Text className="text-lg font-medium text-center">{value}</Text>
        </Flex>
    </Card>
);

export default CustomCard;
