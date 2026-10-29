import React from 'react';

import { Button, Flex, Typography } from 'antd';
import '@domains/dashboard/Subscriptions/assets/styles/styles.css';
import { Link } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';

const { Text } = Typography;

const SubscriptionHeader = () => {
    const { sm, md } = useScreenSize();
    return (
        <Flex justify="space-between" align="middle" className="mt-3 md:mt-0">
            {md ? (
                <Flex>
                    <Text className="font-medium text-lg sm:text-xl">Softwares -</Text>

                    <Text className="md:text-lg font-thin sm:font-thin sm:ms-1">
                        Comprehensive software solutions
                    </Text>
                </Flex>
            ) : (
                <Flex vertical>
                    <Text className="font-medium text-lg sm:text-xl">Softwares -</Text>

                    <Text className="md:text-lg font-thin sm:font-thin sm:ms-1">
                        Comprehensive software solutions
                    </Text>
                </Flex>
            )}

            <Flex>
                <Flex gap={5} className=" justify-end md:mt-0 xs:mt-3">
                    <Link to="order-history">
                        <Button
                            type="default"
                            danger
                            size={sm ? 'middle' : 'small'}
                            className="md:px-5 text-xs md:text-sm"
                        >
                            Order History
                        </Button>
                    </Link>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default SubscriptionHeader;
