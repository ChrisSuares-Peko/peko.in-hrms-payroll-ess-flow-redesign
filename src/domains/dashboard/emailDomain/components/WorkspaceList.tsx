import React from 'react';

import { Flex, Image, Typography } from 'antd';

const { Text } = Typography;

interface cardProps {
    name: string;
    image: string;
    description: string;
}
const WorkspaceList = ({ image, name, description }: cardProps) => (
    <Flex
        className="relative flex-col transform cursor-pointer xs:bg-white md:bg-white"
        style={{
            transition: 'transform .3s ease-in-out',
            alignItems: 'center', // Center content horizontally
            justifyContent: 'center', // Center content vertically
        }}
    >
        <Flex
            className="w-28 sm:w-24 md:h-28 xs:h-24 rounded-2xl sm:rounded-3xl"
            align="center"
            justify="center"
        >
            <Image
                preview={false}
                src={image}
                width="55px"
                height="55px"
                style={{ objectFit: 'cover' }}
            />
        </Flex>

        <Flex vertical justify="center" align="center" className="w-full sm:w-56">
            <Text
                className="md:text-[.75rem] xxl:text-sm text-black"
                style={{
                    fontWeight: 'bold',
                    textAlign: 'center', // Ensure text is centered
                    width: '100%',
                }}
            >
                {name}&nbsp;-&nbsp;
                <span style={{ fontWeight: 'normal', color: '#000000' }}>{description}</span>
            </Text>
        </Flex>
    </Flex>
);

export default React.memo(WorkspaceList);
