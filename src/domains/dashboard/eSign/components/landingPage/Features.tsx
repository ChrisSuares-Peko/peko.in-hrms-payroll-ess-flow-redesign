import { Col, Flex, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { ReactSVG } from 'react-svg';

import { features } from '../../utils';

const Features = () => (
    <Content className="xl:px-14">
        <Col span={24} className="px-0 my-8 xl:px-10 xxl:px-40">
            <Flex vertical className="w-full text-center gap-[.6rem]">
                <Typography.Text className="text-2xl font-semibold">Key Features</Typography.Text>
                <Typography.Text className=" text-sm sm:text-lg font-normal text-[#757575]">
                    Signing has never been easier
                </Typography.Text>
            </Flex>
            <div className="grid grid-cols-1 gap-6 my-10 sm:my-10 sm:grid-cols-2">
                {features.map((feature, index) => (
                    <Flex
                        key={index}
                        className="p-3 sm:p-5 duration-300 ease-in-out transform rounded-xl border gap-[1rem] sm:gap-[1.25rem] "
                    >
                        <ReactSVG src={feature.icon} className="pt-2" />
                        <Flex vertical gap={10}>
                            <Typography.Text className="text-lg font-semibold">
                                {feature.title}
                            </Typography.Text>
                            <Typography.Text className="text-base font-normal text-[#425466]">
                                {feature.description}
                            </Typography.Text>
                        </Flex>
                    </Flex>
                ))}
            </div>
        </Col>
    </Content>
);

export default Features;
