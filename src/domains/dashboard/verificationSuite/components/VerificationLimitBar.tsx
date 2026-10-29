import React from 'react';

import { Button, Col, Flex, Progress, Row, Skeleton, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';
import { calculatePercentage } from '@utils/calculatePercentage';

type VerificationCountData = {
    usedLimit: number;
    remaining: number;
    exhausted: boolean;
    lastVerificationAddedDate?: string;
};

type Props = {
    countData?: VerificationCountData;
    maxLimit?: number;
    loading: boolean;
    showUpgradeButton?: boolean;
    showLastVerificationDate?: boolean;
};

const VerificationLimitBar = ({
    countData,
    maxLimit,
    loading,
    showUpgradeButton = true,
    showLastVerificationDate = false,
}: Props) => {
    const navigate = useNavigate();

    if (loading) {
        return <Skeleton paragraph={{ rows: 1 }} loading />;
    }

    if (!countData || !maxLimit) return null;

    const { usedLimit } = countData;

    return (
        <Row className="flex w-full p-1 md:py-4">
            <Col className="flex flex-col w-full gap-2 sm:gap-5 sm:flex-row">
                <Flex className="w-full" justify="center" gap="middle" vertical>
                    <Typography.Text className="text-base font-medium">
                        Verifications Limit
                    </Typography.Text>
                    <Progress
                        className="w-full"
                        percent={calculatePercentage(usedLimit, maxLimit)}
                        strokeColor="#05BE63"
                    />
                    {/* {showLastVerificationDate && lastVerificationAddedDate && (
                        <Typography.Text className="text-xs text-gray-400">
                            Last verifications added on{' '}
                            {dayjs(lastVerificationAddedDate).format('DD-MM-YYYY')}
                        </Typography.Text>
                    )} */}
                </Flex>
                <Flex className="sm:pt-8" align="center" gap="middle">
                    <Typography.Text className="text-xs sm:text-xs md:text-sm whitespace-nowrap mt-1">
                        {usedLimit} {usedLimit === 1 ? 'Verification' : 'Verifications'} used of{' '}
                        {maxLimit} Verifications
                    </Typography.Text>
                </Flex>
                {showUpgradeButton && (
                    <Flex className="sm:pt-8" align="center" gap="middle">
                        <Button
                            danger
                            type="default"
                            className="px-4 text-xs font-medium w-fit rounded-md"
                            size="small"
                            onClick={() => navigate(paths.verificationSuite.settings)}
                        >
                            Upgrade
                        </Button>
                    </Flex>
                )}
            </Col>
        </Row>
    );
};

export default VerificationLimitBar;
