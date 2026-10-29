import { Fragment } from 'react';

import { CheckOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import { OnboardingStep } from '../utils/data';

const { Text } = Typography;

interface OnboardingStepsProps {
    steps: OnboardingStep[];
    currentStep?: number;
    widthClassName?: string;
    dividerOrientation?: 'vertical' | 'horizontal';
}

const ACTIVE_COLOR = '#43B75D';
const INACTIVE_COLOR = '#9EA6B3';
const WHITE = '#FFFFFF';

const OnboardingSteps = ({
    steps,
    currentStep = 1,
    widthClassName = 'max-w-xl',
    dividerOrientation = 'vertical',
}: OnboardingStepsProps) => (
    <Flex align="flex-start" className={`w-full ${widthClassName}`.trim()}>
        {steps.map((step, index) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const color = isCompleted || isCurrent ? ACTIVE_COLOR : INACTIVE_COLOR;

            return (
                <Fragment key={step.id}>
                    <Flex
                        vertical
                        align="center"
                        gap={8}
                        aria-current={isCurrent ? 'step' : undefined}
                        className="min-w-0 flex-1 basis-0 text-center sm:min-w-fit sm:flex-none sm:basis-auto"
                    >
                        <Flex
                            align="center"
                            justify="center"
                            className="size-7 shrink-0 rounded-full border"
                            style={{
                                color: isCompleted ? WHITE : color,
                                borderColor: color,
                                // eslint-disable-next-line no-nested-ternary
                                backgroundColor: isCompleted
                                    ? ACTIVE_COLOR
                                    : isCurrent
                                      ? '#ECFDF5'
                                      : WHITE,
                            }}
                        >
                            {isCompleted ? (
                                <CheckOutlined className="text-xs" />
                            ) : (
                                <Text className="text-sm font-medium" style={{ color }}>
                                    {step.id}
                                </Text>
                            )}
                        </Flex>
                        <Text
                            className="text-xs font-medium sm:whitespace-nowrap sm:text-sm"
                            style={{ color }}
                        >
                            {step.label}
                        </Text>
                    </Flex>
                    {index < steps.length - 1 &&
                        (dividerOrientation === 'horizontal' ? (
                            <span
                                aria-hidden
                                className="mt-4 hidden h-px min-w-4 flex-1 bg-slate-200 sm:block"
                            />
                        ) : (
                            <Flex
                                aria-hidden
                                align="center"
                                justify="center"
                                className="hidden h-7 min-w-4 flex-1 sm:flex"
                            >
                                <span className="h-6 w-px bg-slate-200" />
                            </Flex>
                        ))}
                </Fragment>
            );
        })}
    </Flex>
);

export default OnboardingSteps;
