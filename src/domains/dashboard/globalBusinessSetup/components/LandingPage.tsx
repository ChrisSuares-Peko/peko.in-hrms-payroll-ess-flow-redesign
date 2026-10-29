import React from 'react';

import { Flex, Image, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import ActionButtonsWithDemo from './ActionButtonsWithDemo';
import globalBusinessSetup from '../assets/img/globalBusinessSetup.png';

interface NewIndividualLandingPageProps {
    children: React.ReactNode;
    title: string;
    subDescription: string;
}

const NewIndividualLandingPage: React.FC<NewIndividualLandingPageProps> = ({
    children,
    title,
    subDescription,
}) => {
    const formatTitleWithLineBreaks = (mainTitle: string, breakCharacter: string = '|') =>
        mainTitle.split(breakCharacter).map((line, index) => (
            <React.Fragment key={index}>
                {line}
                {index !== title.split(breakCharacter).length - 1 && <br />}
            </React.Fragment>
        ));
    return (
        <Content>
            <Row gutter={[32, 16]}>
                <Flex vertical gap={30}>
                    <Flex justify="center" align="center">
                        <Image
                            src={globalBusinessSetup}
                            alt="GlobalBusinessSetup"
                            preview={false}
                            width={150}
                            style={{ marginBottom: 8 }}
                        />
                    </Flex>
                    <Flex className="w-full px-20" align="center" justify="center">
                        <Typography.Text
                            className="text-4xl font-medium"
                            style={{
                                textAlign: 'center',
                            }}
                        >
                            {formatTitleWithLineBreaks(title, '|')}
                        </Typography.Text>
                    </Flex>

                    {children}
                    <Flex className="w-full " align="center" justify="center">
                        <Typography.Text
                            className="text-lg px-4 md:px-24"
                            style={{
                                textAlign: 'center',

                                lineHeight: '1.6',
                            }}
                        >
                            {subDescription}
                        </Typography.Text>
                    </Flex>

                    <ActionButtonsWithDemo />
                </Flex>
            </Row>
        </Content>
    );
};

export default NewIndividualLandingPage;
