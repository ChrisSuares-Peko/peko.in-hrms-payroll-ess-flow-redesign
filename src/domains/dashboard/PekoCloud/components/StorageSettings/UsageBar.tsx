import React from 'react';

import { Col, Flex, Progress, Typography, Skeleton } from 'antd';

import { useStorageDetails } from '../../hooks/useStorageDetailsApi';
import { calculatePercentage, formatBytes } from '../../utils/helperFunctions';

const UsageBar = () => {
    const { storageData, storageLoading } = useStorageDetails();
    return (
        <Col className="mt-10">
            {storageLoading ? (
                <Skeleton />
            ) : (
                <Flex justify="center" gap="large" vertical>
                    <Typography.Text className="text-lg font-medium">
                        Storage Capacity: {storageData?.storageAvailable} GB
                    </Typography.Text>
                    <Progress
                        className="px-4"
                        type="circle"
                        percent={calculatePercentage(
                            storageData?.storageUsedInGB,
                            storageData?.storageAvailable
                        )}
                        format={() => (
                            <Typography.Text className="text-lg">
                                {formatBytes(storageData?.storageUsedInBytes)} used of{' '}
                                {storageData?.storageAvailable} GB
                            </Typography.Text>
                        )}
                        size={250}
                        strokeWidth={5}
                    />
                </Flex>
            )}
        </Col>
    );
};

export default UsageBar;
