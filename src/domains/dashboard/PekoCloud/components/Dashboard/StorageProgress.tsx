import React from 'react';

import { Button, Col, Flex, Progress, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { useStorageDetails } from '../../hooks/useStorageDetailsApi';
import { calculatePercentage, formatBytes } from '../../utils/helperFunctions';

const StorageProgress = () => {
    const navigate = useNavigate();
    const { user } = useAppSelector(state => state.reducer.user);

    const { storageData, storageLoading } = useStorageDetails();
    return (
        !storageLoading && (
            <Row className="flex w-full justify-between p-1 mb-3">
                <Col className="flex flex-col w-full gap-2 sm:gap-5 sm:flex-row">
                    <Flex className="w-full" justify="center" gap="middle" vertical>
                        <Typography.Text className="text-lg font-medium">
                            Storage Capacity
                        </Typography.Text>
                        <Progress
                            className="custom-progress-bar"
                            percent={calculatePercentage(
                                storageData?.storageUsedInGB,
                                storageData?.storageAvailable
                            )}
                            showInfo={false}
                            strokeColor="#05BE63"
                        />
                    </Flex>
                    <Flex className=" sm:pt-8" align="center" gap="middle">
                        <Typography.Text className="text-xs sm:text-sm md:text-base whitespace-nowrap">
                            {formatBytes(storageData?.storageUsedInBytes)} used of{' '}
                            {storageData?.storageAvailable} GB
                        </Typography.Text>
                    </Flex>
                    {user?.roleName !== 'corporate sub user' && (
                        <Flex className=" sm:pt-8" align="center" gap="middle">
                            <Button
                                danger
                                type="default"
                                className="px-4 text-xs font-medium w-fit"
                                size="small"
                                onClick={() => navigate(paths.eSign.settings)}
                            >
                                Upgrade
                            </Button>
                        </Flex>
                    )}
                </Col>
            </Row>
        )
    );
};

export default StorageProgress;
