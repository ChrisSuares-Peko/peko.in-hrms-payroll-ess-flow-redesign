import { useState } from 'react';

import { Button, Col, Flex, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { PlanType } from '@src/domains/dashboard/plans/types';
import { PLAN_DETAILS_SESSION_KEY } from '@src/domains/dashboard/plans/utils';
import { paths } from '@src/routes/paths';

import SwitchPlanWeb from './SwitchPlanWeb';
import { PackageDetails } from '../types';

type Props = {
    serviceName: string;
    packageDetails: PackageDetails;
};

// Shown on a service's subscription page for a basic/free user (no paid GROUP plan) who doesn't yet own
// this service's individual package. Reuses the same Subscribe → ReviewOrder mandate flow as the
// first-time landing page (NewIndividualLandingPage): stash plan details, then go to review order.
const UpgradeToIndividualCTA = ({ serviceName, packageDetails }: Props) => {
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState<PlanType>(PlanType.Monthly);

    const handleUpgrade = () => {
        sessionStorage.setItem(
            PLAN_DETAILS_SESSION_KEY,
            JSON.stringify({
                url: window.location.href.split('?')[0],
                service: serviceName,
                planId: packageDetails.id,
                selectedType,
                isAddOns: false,
            })
        );
        navigate(`/${paths.plans.index}/${paths.plans.reviewOrder}`);
    };

    return (
        <Flex
            vertical
            gap={16}
            className="w-full p-6 mb-6 bg-white border border-gray-200 border-solid rounded-2xl"
        >
            <Flex vertical gap={4}>
                <Typography.Text className="text-lg font-semibold">
                    Upgrade to the {packageDetails.packageName} individual plan
                </Typography.Text>
                <Typography.Text className="text-[#6b7280]">
                    Get a higher limit and dedicated pricing for {serviceName} — no full bundle
                    required.
                </Typography.Text>
            </Flex>

            {packageDetails.packagePrices && (
                <Row>
                    <Col xs={24} md={18}>
                        <SwitchPlanWeb
                            handleChange={tab => setSelectedType(tab)}
                            selectedType={selectedType}
                            price={packageDetails.packagePrices}
                            discount={packageDetails.discount}
                        />
                    </Col>
                </Row>
            )}

            <Flex>
                <Button type="primary" danger size="large" onClick={handleUpgrade}>
                    Upgrade Now
                </Button>
            </Flex>
        </Flex>
    );
};

export default UpgradeToIndividualCTA;
