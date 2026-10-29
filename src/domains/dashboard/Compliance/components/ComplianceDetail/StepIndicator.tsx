import { Divider, Flex, Typography } from 'antd';

import { steps } from '../../utils/complianceDetail';

const { Text } = Typography;

interface StepIndicatorProps {
    currentStep: number;
    onStepClick?: (step: number) => void;
}

export default function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 sm:gap-3 w-full">
            {steps.map((step, idx) => {
                const isActive = idx === currentStep;
                const isPast = idx < currentStep;
                const isActiveOrPast = isActive || isPast;
                const clickable = !!onStepClick;
                return (
                    <div key={step.key} className="flex items-center gap-3">
                        <Flex
                            align="center"
                            gap={12}
                            onClick={() => onStepClick?.(idx)}
                            style={{ cursor: clickable ? 'pointer' : 'default' }}
                        >
                            {isActive ? (
                                <Flex
                                    align="center"
                                    justify="center"
                                    className="rounded-full shrink-0 size-10 bg-white border-[1.5px] border-[#ff4f4f]"
                                >
                                    <Flex
                                        align="center"
                                        justify="center"
                                        className="rounded-full size-8 bg-[#ff4f4f] text-white"
                                    >
                                        {step.icon}
                                    </Flex>
                                </Flex>
                            ) : (
                                <Flex
                                    align="center"
                                    justify="center"
                                    className={`rounded-[18px] shrink-0 size-9 ${isPast ? 'bg-[#ff4f4f] text-white' : 'bg-[#eeeeee] text-[#a9acb4]'}`}
                                >
                                    {step.icon}
                                </Flex>
                            )}
                            <Text
                                className="!text-[14px] !font-medium !leading-none !whitespace-nowrap"
                                style={{ color: isActiveOrPast ? '#ff4f4f' : '#a9acb4' }}
                            >
                                {step.label}
                            </Text>
                        </Flex>
                        {idx < steps.length - 1 && (
                            <Divider className="!m-0 !w-11 !min-w-0 !border-[#e5e7eb] !hidden sm:!block" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
