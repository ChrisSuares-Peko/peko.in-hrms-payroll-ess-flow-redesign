// PROTOTYPE-SETUP: step-by-step shell for /onboarding/payroll/* and /onboarding/ess/*, with a switcher
// between the two flows. Renders inside the dashboard layout so the sidebar stays visible.
import { Suspense } from 'react';

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Row, Segmented, Select, Skeleton, Steps, Typography } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { ESS_ONBOARDING_ROOT, PAYROLL_ONBOARDING_ROOT } from '../essSession';
import {
    ESS_ONBOARDING_STEPS,
    OnboardingFlow,
    OnboardingStep,
    PAYROLL_ONBOARDING_STEPS,
} from './steps';

const FLOWS: Record<OnboardingFlow, { root: string; steps: OnboardingStep[]; label: string }> = {
    payroll: { root: PAYROLL_ONBOARDING_ROOT, steps: PAYROLL_ONBOARDING_STEPS, label: 'Payroll' },
    ess: { root: ESS_ONBOARDING_ROOT, steps: ESS_ONBOARDING_STEPS, label: 'ESS (employee)' },
};

const OnboardingLayout = ({ flow }: { flow: OnboardingFlow }) => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { root, steps } = FLOWS[flow];

    const slug = pathname.toLowerCase().slice(root.length).split('/')[1] ?? '';
    const currentIndex = Math.max(
        0,
        steps.findIndex(step => step.slug === slug)
    );
    const current = steps[currentIndex];
    const goTo = (index: number) => navigate(`${root}/${steps[index].slug}`);

    return (
        <Flex vertical gap={16} className="w-full min-w-0">
            <Flex justify="space-between" align="center" gap={12} wrap="wrap">
                <Typography.Title level={4} className="!m-0">
                    Onboarding flows
                </Typography.Title>
                <Segmented
                    value={flow}
                    options={(Object.keys(FLOWS) as OnboardingFlow[]).map(key => ({
                        label: FLOWS[key].label,
                        value: key,
                    }))}
                    onChange={value =>
                        navigate(
                            `${FLOWS[value as OnboardingFlow].root}/${FLOWS[value as OnboardingFlow].steps[0].slug}`
                        )
                    }
                />
            </Flex>

            <Row gutter={[16, 16]}>
                <Col xs={0} lg={6}>
                    <Card size="small">
                        <Steps
                            direction="vertical"
                            size="small"
                            current={currentIndex}
                            onChange={goTo}
                            items={steps.map(step => ({ title: step.title }))}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={18} className="min-w-0">
                    <Flex vertical gap={16} className="w-full min-w-0">
                        <Card size="small">
                            <Flex vertical gap={12}>
                                <Select
                                    className="w-full lg:!hidden"
                                    value={currentIndex}
                                    onChange={goTo}
                                    options={steps.map((step, index) => ({
                                        label: `${index + 1}. ${step.title}`,
                                        value: index,
                                    }))}
                                />
                                <Flex justify="space-between" align="center" gap={12} wrap="wrap">
                                    <Flex vertical className="min-w-0">
                                        <Typography.Text type="secondary" className="text-xs">
                                            Step {currentIndex + 1} of {steps.length}
                                        </Typography.Text>
                                        <Typography.Text strong>{current.title}</Typography.Text>
                                        <Typography.Text type="secondary" className="text-xs">
                                            {current.description}
                                        </Typography.Text>
                                    </Flex>
                                    <Flex gap={8}>
                                        <Button
                                            icon={<LeftOutlined />}
                                            disabled={currentIndex === 0}
                                            onClick={() => goTo(currentIndex - 1)}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            type="primary"
                                            disabled={currentIndex === steps.length - 1}
                                            onClick={() => goTo(currentIndex + 1)}
                                        >
                                            Next <RightOutlined />
                                        </Button>
                                    </Flex>
                                </Flex>
                            </Flex>
                        </Card>
                        <Suspense fallback={<Skeleton active />}>
                            <Outlet />
                        </Suspense>
                    </Flex>
                </Col>
            </Row>
        </Flex>
    );
};

export default OnboardingLayout;
