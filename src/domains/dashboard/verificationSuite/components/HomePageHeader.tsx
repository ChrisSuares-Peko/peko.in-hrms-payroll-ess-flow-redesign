import React from 'react';

import { Button, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

const { Text } = Typography;

const HomePageHeader = () => {
    const navigate = useNavigate();
    const { sm } = useScreenSize();
    return (
        <Flex className="flex-col justify-between mt-3 md:mt-0 xs:flex-row">
            <Flex className="md:align-middle" align="center">
                <Text className="flex-shrink-0 text-lg font-medium sm:text-xl">
                    Verification Suite{' '}
                </Text>
            </Flex>

            <Flex className="align-middle md:mt-0">
                <Button
                    type="default"
                    danger
                    size={sm ? 'middle' : 'small'}
                    className="text-xs md:px-5 md:text-sm"
                    onClick={() => navigate(paths.verificationSuite.verificationHistory)}
                >
                    Verification History
                </Button>
            </Flex>
        </Flex>
    );
};

export default HomePageHeader;
