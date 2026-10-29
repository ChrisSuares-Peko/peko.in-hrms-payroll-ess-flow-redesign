import React from 'react';

import { CheckOutlined } from '@ant-design/icons';
import { Flex } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

import { IRN_STEPS, FORM_STEP_TO_DISPLAY } from '../../constants/generateIrn';

interface Props {
    currentFormStep: number;
}

const IrnStepper: React.FC<Props> = ({ currentFormStep }) => {
    const activeDisplayStep = FORM_STEP_TO_DISPLAY[currentFormStep];

    const getStepState = (stepNumber: number): 'completed' | 'active' | 'upcoming' => {
        if (stepNumber === activeDisplayStep) return 'active';
        if (stepNumber < activeDisplayStep) return 'completed';
        return 'upcoming';
    };

    const CIRCLE_CLASS: Record<string, string> = {
        active: 'bg-[#FF4F4F] text-white',
        completed: 'bg-[#DCFCE7] text-[#16A34A]',
        upcoming: 'border-2 border-[#E4E4E7] bg-white text-[#8B8B8B]',
    };

    return (
        <Flex align="center" gap={4} className="w-full">
            {IRN_STEPS.map((step, index) => {
                const state = getStepState(step.number);
                const circleClass = CIRCLE_CLASS[state];
                return (
                <React.Fragment key={step.number}>
                    <Flex vertical align="center" gap={8} className="flex-shrink-0 md:w-28">
                        <Flex
                            align="center"
                            justify="center"
                            className={`w-8 h-8 md:w-10 md:h-10 rounded-full text-xs md:text-md font-semibold transition-all ${circleClass}`}
                        >
                            {state === 'completed' ? (
                                <CheckOutlined style={{ fontSize: 12 }} />
                            ) : (
                                step.number
                            )}
                        </Flex>
                        <Flex vertical align="center" gap={2} className="hidden md:flex w-full text-center">
                            <TypographyText
                                className={`text-sm font-semibold text-center w-full ${
                                    state === 'upcoming' ? 'text-[#9CA3AF]' : ''
                                }`}
                            >
                                {step.title}
                            </TypographyText>
                            <TypographyText className="text-xs font-normal leading-4 text-[#6B7280] text-center w-full">
                                {step.subtitle}
                            </TypographyText>
                        </Flex>
                    </Flex>
                    {index < IRN_STEPS.length - 1 && <div className="flex-1 h-px bg-[#E4E4E7]" />}
                </React.Fragment>
                );
            })}
        </Flex>
    );
};

export default IrnStepper;
