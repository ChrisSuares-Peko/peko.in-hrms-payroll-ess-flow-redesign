import { Button, Card, Flex, Tag, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import iconStepCheck from '../assets/icons/icon-step-check.svg';
import iconTickCircleFilledGreen from '../assets/icons/icon-tick-circle-filled-green.svg';
import { complianceHealthItems } from '../utils/data';

const { Text, Title } = Typography;

const STEPS = [
    {
        title: 'Application Submitted',
        description: null,
        date: 'Jan 20, 2026',
    },
    {
        title: 'Review by Peko',
        description: "We couldn't read the document properly. Kindly upload a clear copy again.",
        date: 'Jan 20, 2026',
    },
    {
        title: 'E-sign / OTP Verification',
        description: 'Review documents and complete e-sign to continue.',
        date: null,
    },
    {
        title: 'Filing Submitted',
        description: 'Your compliance filing has been successfully submitted and is currently under processing.',
        date: null,
    },
    {
        title: 'Completed',
        description: 'Your compliance process has been completed successfully.',
        date: null,
    },
];

export default function ComplianceCompletedView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const item = complianceHealthItems.find((c) => c.id === id);
    const title = item?.title ?? 'Compliance';

    return (
        <Flex vertical gap={32} className="w-full">
            {/* Success header */}
            <Flex vertical align="center" gap={20}>
                <div className="bg-[#e5ffe8] rounded-full p-4 inline-flex">
                    <img src={iconTickCircleFilledGreen} alt="completed" className="w-[88px] h-[88px]" />
                </div>
                <Title level={2} className="!text-[#334155] !text-[28px] !font-semibold !m-0 text-center">
                    {title} Submitted
                </Title>
                <Text className="text-[#475569] text-lg text-center leading-7">
                    Your {title} filing has been successfully submitted.
                    <br />
                    {item?.applicationId ? `Application ID: ${item.applicationId} ` : ''}You can track the status and download the acknowledgement anytime.
                </Text>
            </Flex>

            {/* Timeline card */}
            <Card
                className="!rounded-[36px] !border-[0.5px] !border-[#ccc] max-w-[1060px] w-full mx-auto"
                styles={{ body: { padding: '40px 40px 40px 56px' } }}
            >
                <Flex vertical gap={16} className="relative">
                    {STEPS.map((step, index) => (
                        <Flex key={index} gap={8} align="flex-start">
                            {/* Icon + line column */}
                            <Flex vertical align="center" className="w-8 shrink-0 relative">
                                <Flex
                                    align="center"
                                    justify="center"
                                    className="w-8 h-8 rounded-full bg-[#e7ffec] border border-[#43b75d] shrink-0 mt-[14px] z-[1]"
                                >
                                    <img src={iconStepCheck} alt="" className="w-[21px] h-[21px]" />
                                </Flex>
                                {index < STEPS.length - 1 && (
                                    <div className="h-[82px] w-0.5 bg-[#D0D5DD] mt-2 mb-2" />
                                )}
                            </Flex>

                            {/* Card */}
                            <Card
                                className="!rounded-3xl !border !border-[#efefef] flex-1"
                                styles={{ body: { padding: '16px 24px 16px 16px', background: '#fbfbfb', borderRadius: 24 } }}
                            >
                                <Flex align="center" justify="space-between">
                                    <Flex vertical gap={step.description ? 4 : 0} className="flex-1">
                                        <Text className="text-xl font-semibold text-[#1e293b] leading-7">
                                            {step.title}
                                        </Text>
                                        {step.description && (
                                            <Text className="text-sm text-[#667085] leading-6 whitespace-nowrap">
                                                {step.description}
                                            </Text>
                                        )}
                                        {step.date && (
                                            <Text className="text-xs font-medium text-[#667085]">
                                                {step.date}
                                            </Text>
                                        )}
                                    </Flex>
                                    <Tag className="!bg-[#ecffe8] !border !border-[#c0f0b8] !rounded-lg !py-1 !px-4 !ml-4 !text-[#26a411] !text-base">
                                        Completed
                                    </Tag>
                                </Flex>
                            </Card>
                        </Flex>
                    ))}
                </Flex>
            </Card>

            {/* Actions */}
            <Flex gap={16} justify="flex-end">
                <Button
                    className="!h-12 !rounded-lg !border-[#ff4f4f] !text-[#ff4f4f] !font-medium !text-base !px-[22px]"
                    onClick={() => navigate(`${paths.dashboard.compliance}/${paths.compliance.detail.replace(':id', id ?? '')}`)}
                >
                    View application
                </Button>
                <Button
                    type="primary"
                    className="!h-12 !rounded-lg !bg-[#ff4f4f] !border-[#ff4f4f] !font-medium !text-base !px-[22px]"
                    onClick={() => navigate(paths.dashboard.compliance)}
                >
                    Back to dashboard
                </Button>
            </Flex>
        </Flex>
    );
}
