import React from 'react';

import { Button, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

const WorksHeader = () => {
    const navigate = useNavigate();
    const { md, sm } = useScreenSize();
    return (
        <Flex vertical>
            {md ? (
                <Flex justify="space-between" align="middle" className="mt-3 md:mt-0">
                    <Flex>
                        <Typography.Text className="font-medium text-lg sm:text-xl">
                            Works -
                        </Typography.Text>
                        <Typography.Text className="md:text-lg font-thin sm:font-thin sm:ms-1">
                            Get things done faster
                        </Typography.Text>
                    </Flex>
                    <Flex>
                        <Flex gap={5} className=" justify-end md:mt-0 xs:mt-3">
                            <Button
                                type="default"
                                danger
                                size={sm ? 'middle' : 'small'}
                                className="md:px-5 text-xs md:text-sm"
                                onClick={() =>
                                    navigate(`/${paths.dashboard.works}/${paths.works.orderHistory}`)
                                }
                            >
                                Order History
                            </Button>
                        </Flex>
                    </Flex>
                </Flex>
            ) : (
                <Flex vertical gap={10} align="center" className="mt-3 md:mt-0">
                    <Typography.Text className="font-medium text-xl">Works</Typography.Text>
                    <Typography.Text className="text-lg font-normal sm:font-thin">
                        Get things done faster
                    </Typography.Text>
                    <Button
                        type="default"
                        danger
                        // size={sm ? 'middle' : 'small'}
                        className="px-14 mt-2"
                        onClick={() =>
                            navigate(`${paths.dashboard.works}/${paths.works.orderHistory}`)
                        }
                    >
                        Order History
                    </Button>
                </Flex>
            )}
        </Flex>
    );
};

export default WorksHeader;
