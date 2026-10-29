import { Flex, Typography } from 'antd';

const { Text } = Typography;

const WishListHeadingCreate = () => (
    <Flex className="w-full bg-[#212121] mb-3 px-3 py-2 rounded-lg gap-3 flex-col md:flex-row pr-11 hidden xl:flex">
        <Flex className="flex-col" style={{ flex: '2' }}>
            <Text className="text-white ">Title</Text>
        </Flex>
        <Flex className="flex-col" style={{ flex: '1' }}>
            <Text className="text-white ">Quantity</Text>
        </Flex>
        <Flex className="flex-col" style={{ flex: '1' }}>
            <Text className="text-white ">Price</Text>
        </Flex>
        <Flex className="flex-col" style={{ flex: '1' }}>
            <Text className="text-white ">Gst(%)</Text>
        </Flex>
        <Flex className="flex-col" style={{ flex: '1' }}>
            <Text className="text-white ">Discount</Text>
        </Flex>
        <Flex className="flex-col" style={{ flex: '1' }}>
            <Text className="text-white ">Amount</Text>
        </Flex>
    </Flex>
);

export default WishListHeadingCreate;
