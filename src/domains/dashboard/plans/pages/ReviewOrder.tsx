import React, { useEffect } from 'react';

import { Flex, Layout, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import CustomBreadCrumb from '@components/molecular/breadcrumbs/CustomBreadcrumb';
import { paths } from '@src/routes/paths';

import AddonDetailCard from '../components/add-ons/AddonDetailCard';
import MandateAddonCard from '../components/add-ons/MandateAddonCard';
import GoBackIcon from '../components/GoBackIcon';
import PlanDetailsCard from '../components/subscription/review-order/PlanDetailsCard';
import { SelectedType } from '../types';
import { PLAN_DETAILS_SESSION_KEY } from '../utils';

interface State {
    planId: number;
    selectedType: SelectedType;
    isAddOns: boolean;
    isMandate?: boolean;
    url: string;
    addOnpaymentPayload: {
        addonsAccessKey: string;
        packageId: number;
        pgAmount: number;
        quantity: number;
        isDynamicUnitPricing?: boolean;
        title: string;
        description: string;
        rows: {
            column1: string;
            column2: string;
            column3: string;
        }[];
    };
}

const ReviewOrder = () => {
    const navigate = useNavigate();
    const subscriptionData = sessionStorage.getItem(PLAN_DETAILS_SESSION_KEY);
    useEffect(() => {
        if (!subscriptionData) {
            navigate(`/${paths.plans.index}`);
        }
    }, [navigate, subscriptionData]);
    if (!subscriptionData) {
        return null;
    }
    const { planId, selectedType, isAddOns, isMandate, url, addOnpaymentPayload }: State = JSON.parse(
        subscriptionData as string
    );
    return (
        <Layout className="overflow-hidden bg-white min-h-svh">
            <Content className="">
                <CustomBreadCrumb />
                <GoBackIcon url={url} isAddOns={isAddOns} />
                <Flex className="my-5">
                    <Typography.Text className="text-xl font-semibold text-gray-900">
                        Review your plan
                    </Typography.Text>
                </Flex>

                {isMandate && addOnpaymentPayload && (
                    <MandateAddonCard addOnpaymentPayload={addOnpaymentPayload} planId={planId} />
                )}
                {!isMandate && isAddOns && (
                    <AddonDetailCard paymentPayload={addOnpaymentPayload} />
                )}
                {!isMandate && !isAddOns && (
                    <PlanDetailsCard planId={planId} selectedType={selectedType} isMandate={isMandate} />
                )}
            </Content>
        </Layout>
    );
};

export default ReviewOrder;
