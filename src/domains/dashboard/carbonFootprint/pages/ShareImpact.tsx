import { Divider, Flex, Image, List, Row, Typography } from 'antd';

import PRImg from '../assets/images/PR-img.jpeg';
import { data } from '../utils/shareImpact/data';

const { Text } = Typography;

const ShareImpact = () => (
    <Row className="xs:p-0 md:px-8 lg:px-14 mt-20">
        <Flex className="w-full" justify="center">
            <Text className="text-valueText text-2xl w-3/4 text-center xl:text-2xl xxl:text-4xl">
                We aim to inspire everyone to help save our planet. To amplify this message, we
                provide access to tools, ads, press releases and more for effective advocacy.
            </Text>
        </Flex>
        <Flex
            gap="large"
            className="xs:mx-0 md:mx-auto mt-8 w-full"
            wrap="wrap"
            align="center"
            justify="center"
        >
            <Flex gap="large" className="mt-12">
                <Flex align="center" vertical>
                    <Text className="text-valueText text-xl xxl:text-2xl">PR Template</Text>
                    <Image width={300} src={PRImg} />
                </Flex>
                <Divider className="mt-6 h-96 border-iconRed xs:hidden md:inline" type="vertical" />
            </Flex>

            <Flex gap="large" className="mt-12">
                <Flex align="center" className="w-64" vertical>
                    <Text className="text-valueText text-xl xxl:text-2xl">ADS</Text>
                    <Text className="text-valueText xxl:text-lg text-base mt-4 text-start">
                        What is the difference between weather and climate?
                    </Text>
                </Flex>
                <Divider className="mt-6 h-96 border-iconRed xs:hidden md:inline" type="vertical" />
            </Flex>

            <Flex gap="large" className="mt-12">
                <Flex align="center" className="w-64" vertical>
                    <Text className="text-valueText text-xl xxl:text-2xl">Resources</Text>
                    <List
                        dataSource={data}
                        renderItem={item => (
                            <List.Item className="border-0 mt-1">
                                <Flex align="center" gap="middle ">
                                    <Flex className="w-2 h-2 bg-iconRed text-transparent">.</Flex>
                                    <Text className="underline ms-4 text-base xxl:text-lg  ">
                                        {item}
                                    </Text>
                                </Flex>
                            </List.Item>
                        )}
                    />
                </Flex>
                <Divider
                    className="mt-6 h-96 border-transparent xs:hidden md:inline"
                    type="vertical"
                />
            </Flex>
        </Flex>
    </Row>
);

export default ShareImpact;
