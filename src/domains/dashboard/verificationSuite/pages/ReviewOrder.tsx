import React, { useEffect } from 'react';

import { Flex, Image, Layout, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import back from '@assets/svg/grayBack.svg';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import VerificationAddonReviewCard from '../components/VerificationAddonReviewCard';

const ReviewOrder = () => {
    const navigate = useNavigate();
    const { billSummary } = useAppSelector(state => state.reducer.payment);
    const settingsPath = `${paths.dashboard.verificationSuite}/${paths.verificationSuite.settings}`;

    useEffect(() => {
        if (!billSummary || billSummary.length === 0) {
            navigate(settingsPath);
        }
    }, [billSummary, navigate, settingsPath]);

    if (!billSummary || billSummary.length === 0) {
        return null;
    }

    return (
        <Layout className="overflow-hidden bg-white min-h-svh">
            <Content>
                <Flex
                    className="cursor-pointer w-fit"
                    align="center"
                    gap={6}
                    onClick={() => navigate(settingsPath)}
                >
                    <Image
                        src={back}
                        alt="goback"
                        preview={false}
                        style={{ width: '1.2rem', height: '1.2rem' }}
                    />
                    <Typography.Text className="text-[#4D4D4D]">Go Back</Typography.Text>
                </Flex>
                <Flex className="my-5">
                    <Typography.Text className="text-xl font-semibold text-gray-900">
                        Review your order
                    </Typography.Text>
                </Flex>
                <VerificationAddonReviewCard />
            </Content>
        </Layout>
    );
};

export default ReviewOrder;
