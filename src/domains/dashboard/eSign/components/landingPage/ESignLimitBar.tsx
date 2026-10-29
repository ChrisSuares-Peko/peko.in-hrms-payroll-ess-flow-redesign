import React from 'react';

import { Button, Col, Flex, Progress, Row, Skeleton, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { SubscriptionAddOnResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { calculatePercentage } from '@utils/calculatePercentage';

type Props = {
    count?: number;
    countLoading: boolean;
    addOnLoading: boolean;
    addonData?: SubscriptionAddOnResponse;
};

const ESignLimitBar = ({ count, countLoading, addOnLoading, addonData }: Props) => {
    const navigate = useNavigate();
    const { user } = useAppSelector(state => state.reducer.user);
    if (addOnLoading || countLoading) {
        return <Skeleton paragraph={{ rows: 1 }} loading />;
    }

    return (
        !addOnLoading && (
            <Row className="flex w-full p-1 md:py-4">
                <Col className="flex flex-col w-full gap-2 sm:gap-5 sm:flex-row">
                    <Flex className="w-full" justify="center" gap="middle" vertical>
                        <Typography.Text className="text-base font-medium">
                            eSign Limit
                        </Typography.Text>
                        <Progress
                            className="w-full"
                            percent={calculatePercentage(count, addonData?.maxLimit)}
                            strokeColor="#05BE63"
                        />
                    </Flex>
                    <Flex className=" sm:pt-8" align="center" gap="middle">
                        <Typography.Text className="text-xs sm:text-sm md:text-base whitespace-nowrap">
                            <Typography.Text className="flex-wrap text-xs sm:text-sm">
                                {count} {count && count > 1 ? 'eSigns' : 'eSign'} used of{' '}
                                {addonData?.maxLimit} eSigns
                            </Typography.Text>
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
                {/* <Col className="flex w-full pt-2 xxl:pt-8 sm:w-2/12 xxl:w-2/12">
                    <Flex className="w-full" justify="end" gap="middle" align='end'>
                        <Button
                            danger
                            type="default"
                            className="w-full px-4 text-xs font-medium sm:w-fit"
                            size="small"
                            onClick={() => navigate(paths.eSign.settings)}
                        >
                            Upgrade
                        </Button>
                    </Flex>
                </Col> */}
            </Row>
        )
    );
};

export default ESignLimitBar;
