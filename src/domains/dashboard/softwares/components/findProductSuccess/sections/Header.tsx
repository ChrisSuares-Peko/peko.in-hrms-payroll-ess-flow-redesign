import { Flex, Typography } from 'antd';

const { Text } = Typography;

const Header = () => (
    <Flex vertical className="w-full gap-1 justify-start items-start">
        <Text className="font-medium text-2xl">Best Recommandations For You</Text>
    </Flex>
);

export default Header;
