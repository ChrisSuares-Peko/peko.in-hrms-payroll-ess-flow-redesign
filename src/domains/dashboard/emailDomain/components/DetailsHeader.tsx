import React from 'react';

import { Button, Flex, Image, Typography } from 'antd';

import banner from '@domains/dashboard/emailDomain/assets/banner.png';
import workspaces from '@domains/dashboard/emailDomain/assets/googleworkspace.png';

const { Text, Paragraph } = Typography;

const DetailsHeader = () => (
    <>
        <Image
            src={workspaces}
            preview={false}
            style={{ width: '100%', height: 'auto', maxHeight: '9rem' }} // Use auto for height
        />
        <Flex
            justify="space-between" // Space items between
            align="center" // Align items vertically centered
            className="flex-wrap mt-4" // Enable wrapping for responsiveness
        >
            <Flex
                vertical
                className="flex-grow w-80" // Allow it to take available space
                style={{ marginRight: '16px' }} // Optional spacing
            >
                <Text className="text-2xl leading-tight">
                    Get GMAIL and many other Google products for your business
                </Text>
                <Paragraph className="w-full mt-6 mb-5 text-lg leading-9 lg:w-11/12 xxl:w-3/4 text-textGrey">
                    The service boasts of a comprehensive suite of powerful apps to streamline
                    workflow, collaborate seamlessly, and enhance efficiency. Equip your team with
                    world-class productivity tools and boost performance like never before.
                </Paragraph>
                <Button
                    danger
                    size="small"
                    type="primary"
                    className="justify-center w-full h-10 mt-5 text-xs font-normal rounded-sm sm:w-40 md:w-44 sm:text-sm sm:font-medium"
                >
                    Get Google Workspace
                </Button>
            </Flex>
            <Image
                src={banner}
                preview={false}
                style={{
                    width: 'auto',
                    height: 'auto',
                    maxHeight: '45rem',
                    maxWidth: '80%',
                    flex: '0 0 auto',
                }}
            />
        </Flex>
    </>
);

export default DetailsHeader;
