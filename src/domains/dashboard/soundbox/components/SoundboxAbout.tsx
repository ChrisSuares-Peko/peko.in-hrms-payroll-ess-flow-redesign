import React from 'react';

import { Col, Card, Flex, Image, Typography } from 'antd';

import soundboxIcon from '@domains/dashboard/soundbox/assets/icons/soundbox-3.png';

function SoundboxAbout() {
    return (
        <>
            <Col xs={24} md={7}>
                <Card bordered className="h-full">
                    <Flex vertical gap={6} align="center">
                        <Flex
                            className={` w-40 sm:w-[6.75rem] rounded-2xl sm:rounded-3xl `}
                            align="center"
                            justify="center"
                        >
                            <Image preview={false} className="`w-[6rem]" src={soundboxIcon} />
                        </Flex>
                    </Flex>
                </Card>
            </Col>
            <Col xs={24} md={17}>
                <Flex vertical gap={15}>
                    <Typography.Paragraph className=" text-lg font-medium ">
                        Soundbox
                    </Typography.Paragraph>
                    <Typography.Paragraph className=" text-base font-light ">
                        Now accept card payments on your paytm soundbox
                    </Typography.Paragraph>
                </Flex>
            </Col>
        </>
    );
}

export default SoundboxAbout;
