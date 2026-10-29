import { Col, Flex, Typography } from 'antd';

type Props = {
    label?: string;
    value?: string | React.ReactNode;
};

const TextCard = ({ label, value }: Props) => (
    <Col span={12} sm={8} md={6} lg={6}>
        <Flex vertical gap={3}>
            <Typography.Text className="font-medium">{value}</Typography.Text>
            {label && <Typography.Text className="text-gray-400">{label}</Typography.Text>}
        </Flex>
    </Col>
);

export default TextCard;
