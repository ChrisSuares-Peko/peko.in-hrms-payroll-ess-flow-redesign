import { useState } from 'react';

import { Flex, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

const GuestCount = () => {
    const [count, setCount] = useState<number>(0);
    const handleIncrement = () => {
        setCount(count + 1);
    };
    const handleDecrement = () => {
        if (count > 0) {
            setCount(count - 1);
        }
    };
    return (
        <Content className="mt-4">
            <Typography.Text className="font-bold ">Guests</Typography.Text>
            <Content className="w-full py-4 mt-3 bg-bgLightGray border border-solid border-gray-200">
                <Flex className="px-5" justify="space-evenly">
                    <Flex vertical>
                        <Content className=" p-2 bg-white border border-solid border-gray-200">
                            <Flex className="px-2">
                                <Typography.Text className="" onClick={handleIncrement}>
                                    +
                                </Typography.Text>
                            </Flex>
                        </Content>
                    </Flex>
                    <Typography.Text className="font-extrabold mt-2">{count}</Typography.Text>
                    <Flex vertical>
                        <Content className=" p-2  bg-white border border-solid border-gray-200">
                            <Flex className="px-2">
                                <Typography.Text className="" onClick={handleDecrement}>
                                    -
                                </Typography.Text>
                            </Flex>
                        </Content>
                    </Flex>
                </Flex>
            </Content>
        </Content>
    );
};

export default GuestCount;
