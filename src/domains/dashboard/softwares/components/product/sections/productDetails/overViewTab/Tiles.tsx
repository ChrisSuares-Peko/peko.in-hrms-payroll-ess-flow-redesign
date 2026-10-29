import { Flex, Typography } from 'antd';

const { Text } = Typography;
type Props = {
    title: string;
};

const Tiles = ({ title }: Props) => (
    <Flex align="center" className="px-3 py-2 border rounded-full" style={{ width: 'fit-content' }}>
        <Text className="text-sm text-[#425466] font-normal">{title} </Text>
    </Flex>
);

export default Tiles;
