import { CheckOutlined, RightOutlined } from '@ant-design/icons';
import { Flex } from 'antd';

interface OnboardingStepperProps {
    /** active step index */
    current: number;
    /** ordered step labels; defaults to Documents → Bank → Emergency */
    steps?: string[];
}

const DEFAULT_STEPS = ['Documents', 'Bank', 'Emergency'];

const circleClass = (isDone: boolean, isActive: boolean) => {
    if (isDone) return 'bg-[#12B76A] text-white';
    if (isActive) return 'bg-brandColor text-white';
    return 'border border-solid border-[#d9d9d9] text-gray-400';
};

const labelClass = (isDone: boolean, isActive: boolean) => {
    if (isActive) return 'text-brandColor font-medium';
    if (isDone) return 'text-[#12B76A]';
    return 'text-gray-400';
};

const OnboardingStepper = ({ current, steps = DEFAULT_STEPS }: OnboardingStepperProps) => (
    <Flex align="center" justify="center" gap={16} className="mb-8">
        {steps.map((label, index) => {
            const isDone = index < current;
            const isActive = index === current;
            return (
                <Flex key={label} align="center" gap={16}>
                    <Flex align="center" gap={8}>
                        <Flex
                            align="center"
                            justify="center"
                            className={`size-5 rounded-full text-[11px] font-medium ${circleClass(isDone, isActive)}`}
                        >
                            {isDone ? <CheckOutlined className="text-[10px]" /> : index + 1}
                        </Flex>
                        <span className={`text-sm ${labelClass(isDone, isActive)}`}>{label}</span>
                    </Flex>
                    {index < steps.length - 1 && (
                        <RightOutlined className="text-[10px] text-gray-300" />
                    )}
                </Flex>
            );
        })}
    </Flex>
);

export default OnboardingStepper;
