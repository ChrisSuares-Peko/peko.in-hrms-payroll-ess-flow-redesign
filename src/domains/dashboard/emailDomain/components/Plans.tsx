import React, { useEffect, useRef } from 'react';

import { Col, Empty, Flex, Row, Skeleton } from 'antd';

import MoreTransactions from '@assets/svg/moretransactions.svg';

import PlanCard from './PlanCard';
import SwitchPlan from './SwitchPlan';
import { EmailDomainPlans } from '../types/types';

interface props {
    isLoading: boolean;
    plansData: EmailDomainPlans[];
    selectedType: string;
    handleChange: (data: any) => void;
    isFormSubmitted: boolean;
    handlePurchase: ({
        amount,
        planId,
        planName,
    }: {
        amount: string;
        planId: number;
        planName: string;
    }) => void;
}

const Plans = ({
    isLoading,
    plansData,
    selectedType,
    handleChange,
    isFormSubmitted,
    handlePurchase,
}: props) => {
    const bottomRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [isFormSubmitted]);
    return (
        <Flex vertical className="mt-5 " ref={bottomRef} justify="center" align="center">
            {!isLoading && plansData.length > 0 && (
                <SwitchPlan selectedType={selectedType} handleChange={handleChange} />
            )}
            <Col span={24}>
                <Row justify="center" gutter={[20, 20]}>
                    {isLoading && (
                        <>
                            <Col xs={24} sm={12} md={8} xl={8}>
                                <Skeleton active className="h-96" />
                            </Col>
                            <Col xs={24} sm={12} md={8} xl={8}>
                                <Skeleton active className="h-96" />
                            </Col>
                            <Col xs={24} sm={12} md={8} xl={8}>
                                <Skeleton active className="h-96" />
                            </Col>
                        </>
                    )}
                    {!isLoading && plansData.length === 0 && (
                        <Col span={24}>
                            <Empty
                                image={
                                    <img
                                        src={MoreTransactions}
                                        alt="No plans"
                                        style={{ width: '200px', height: '200px' }}
                                    />
                                }
                                description={
                                    <div className="font-normal" style={{ marginTop: '80px' }}>
                                        No plans to show
                                    </div>
                                }
                            />
                        </Col>
                    )}
                    {!isLoading &&
                        plansData.length > 0 &&
                        plansData.map(plan => (
                            <PlanCard
                                key={plan.id}
                                planId={plan.id}
                                image_url={plan.image_url ?? ''}
                                features={plan?.features ?? []}
                                planName={plan.name}
                                monthlyPrice={plan.monthlyPrice}
                                yearlyPrice={plan.yearlyPrice}
                                selectedType={selectedType}
                                descriptions={plan.descriptions ?? []}
                                handlePurchase={() =>
                                    handlePurchase({
                                        amount:
                                            selectedType === 'Monthly'
                                                ? plan.monthlyPrice
                                                : plan.yearlyPrice,
                                        planId: plan.id,
                                        planName: plan.name,
                                    })
                                }
                            />
                        ))}
                </Row>
            </Col>
        </Flex>
    );
};

export default React.memo(Plans);
