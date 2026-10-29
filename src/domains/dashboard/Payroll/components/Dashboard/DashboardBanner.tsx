import React from 'react';

import { ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Col, Flex, Typography } from 'antd';

import { useAppDispatch } from '@src/hooks/store';

import useOrganizationSettingsApi from '../../hooks/OrganizationSettings/useOrganizationSettingsApi';
import { setPayrollProgress } from '../../slices/payrollAuth';

const DashboardBanner = () => {
    const dispatch = useAppDispatch();
    const { updateSkipDashboard, isLoading: skipDashboardLoader } = useOrganizationSettingsApi();
    const handleSkipDashboard = async () => {
        await updateSkipDashboard(false);
        dispatch(setPayrollProgress({ isSkippedDasboard: false }));
    };
    return (
        <Col className="xs:mb-2 md:mb-4">
            <Flex
                align="center"
                justify="space-between"
                gap={16}
                wrap="wrap"
                className="px-4 py-3 md:px-8 md:py-4"
                style={{
                    background: '#FFFAEB',
                    border: '1px solid #FACC15',
                    borderRadius: 16,
                }}
            >
                <Flex align="center" gap={14} style={{ flex: 1, minWidth: 260 }}>
                    <ExclamationCircleFilled style={{ color: '#F59E0B', fontSize: 18 }} />
                    <Typography.Text className="text-[14px] leading-6 text-[#000000]">
                            <span className="font-semibold">Complete Your Onboarding:</span> It
                            looks like you haven&apos;t completed your onboarding process. Important
                            information like your tax details, bank account, and personal
                            information is missing.
                    </Typography.Text>
                </Flex>
                <Button
                    type="primary"
                    danger
                    className="h-11 rounded-lg border-[#FF4D4F] bg-[#FF4D4F] px-5 font-normal"
                    onClick={handleSkipDashboard}
                    loading={skipDashboardLoader}
                >
                    Complete Onboarding Now
                </Button>
            </Flex>
        </Col>
    );
};

export default DashboardBanner;
