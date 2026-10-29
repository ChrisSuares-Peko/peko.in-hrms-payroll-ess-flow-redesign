import React from 'react';

import { Flex, Image, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import ActionButtonsWithDemo from './ActionButtonsWithDemo';
import globalBusinessSetup from '../assets/img/globalBusinessSetup.png';

type Props = {
    children: React.ReactNode;
    title: string;
    subDescription: string;
};

const AdaptiveCommonLandingPage = ({ title, subDescription, children }: Props) => {
    const formatTitleWithLineBreaks = (mainTitle: string, breakCharacter: string = '|') =>
        mainTitle.split(breakCharacter).map((line, index) => (
            <React.Fragment key={index}>
                {line}
                {index !== title.split(breakCharacter).length - 1 && <br />}
            </React.Fragment>
        ));
    return (
        <Content>
            <Row gutter={[32, 0]}>
                <span>
                    <Flex vertical gap={20}>
                        <Flex justify="center" align="center">
                            <Image src={globalBusinessSetup} alt="GlobalBusinessSetup" preview={false} width={150} />
                        </Flex>
                        <Flex className="w-full" align="center" justify="center">
                            <Typography.Text
                                className="font-medium"
                                style={{
                                    textAlign: 'center',
                                    fontSize: '15px',
                                }}
                            >
                                {formatTitleWithLineBreaks(title, '|')}
                            </Typography.Text>
                        </Flex>
                        <ActionButtonsWithDemo />
                        {children}
                        <Flex className="w-full " align="center" justify="center">
                            <Typography.Text
                                className="text-[#000] font-normal"
                                style={{
                                    textAlign: 'center',
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                }}
                            >
                                {subDescription}
                            </Typography.Text>
                        </Flex>
                    </Flex>
                </span>
            </Row>
        </Content>
    );
};

export default AdaptiveCommonLandingPage;
