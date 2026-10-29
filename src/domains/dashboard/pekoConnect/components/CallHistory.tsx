import React from 'react';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Flex, Input } from 'antd';

// import { list } from './ChatList';

const CallHistory = () => (
    <Flex vertical gap={8} className="flex-grow h-full p-4 bg-white rounded-xl">
        <Flex align="center" gap={8}>
            <Button
                type="text"
                // onClick={onClose}
                shape="circle"
                size="large"
                className="md:hidden"
                icon={<ArrowLeftOutlined />}
            />
            <Input
                type="text"
                placeholder="Looking for"
                className="flex-grow bg-[#F9FAFA] p-3 rounded-xl border-none "
            />
            <Button
                type="primary"
                shape="circle"
                size="large"
                className="bg-[#004C59]"
                // onClick={handleVideoCall}
                // icon={<VideoCameraFilled />}
            />
        </Flex>
        {/* <Flex vertical className="h-full bg-gray-100">
            {list.map(value => (
                <li>
                    <Flex justify="space-between" className="px-5">
                        <Flex gap={20}>
                            <Image
                                width={48}
                                height={48}
                                // src={image}
                                // alt={name}
                                className="object-cover border-2 rounded-full min-w-12 aspect-square border-darkBlue"
                            />
                            <Flex
                                vertical
                                // justify="center"
                                gap={1}
                                className="w-full h-20 border-b border-gray-100"
                            >
                                <Text className="">{value.name}</Text>
                            </Flex>
                        </Flex>
                        <Flex>
                            <Text>{value.message}</Text>
                        </Flex>
                    </Flex>
                </li>
            ))}
        </Flex> */}
    </Flex>
);

export default CallHistory;
