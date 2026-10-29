import { CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import { ProgressStep } from '../../types/index';

interface Props {
    steps: ProgressStep[];
}

const Marker = ({ state }: { state: ProgressStep['state'] }) => {
    if (state === 'done') {
        return (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0F9D58]">
                <CheckOutlined className="text-[11px] text-white" />
            </span>
        );
    }
    if (state === 'active') {
        return (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#0F9D58] bg-white">
                <LoadingOutlined spin className="text-[11px] text-[#0F9D58]" />
            </span>
        );
    }
    return <span className="h-6 w-6 shrink-0 rounded-full border border-[#D0D5DD] bg-white" />;
};

// Horizontal n-step tracker (3 steps for instant reports, 5 for inspections).
// Switches to a vertical rail below `sm`, since 5 labels never fit on a phone.
const ReportProgressTracker = ({ steps }: Props) => {
    const { xs } = useScreenSize();

    if (xs) {
        return (
            <Flex vertical>
                {steps.map((step, index) => (
                    <Flex key={step.label} gap={12}>
                        <Flex vertical align="center">
                            <Marker state={step.state} />
                            {index < steps.length - 1 && (
                                <span
                                    className={`w-px flex-1 ${
                                        step.state === 'done' ? 'bg-[#0F9D58]' : 'bg-[#E4E7EC]'
                                    }`}
                                />
                            )}
                        </Flex>
                        <Typography.Text
                            className={`pb-6 text-sm ${
                                step.state === 'pending'
                                    ? 'text-[#98A2B3]'
                                    : 'font-medium text-[#0A0A0A]'
                            }`}
                        >
                            {step.label}
                        </Typography.Text>
                    </Flex>
                ))}
            </Flex>
        );
    }

    // Each step owns the half-connector on either side of its marker; the outer
    // halves of the first and last steps are transparent so the rail ends flush.
    const connector = (isHidden: boolean, isComplete: boolean) => {
        if (isHidden) return 'bg-transparent';
        return isComplete ? 'bg-[#0F9D58]' : 'bg-[#E4E7EC]';
    };

    return (
        <Flex align="start">
            {steps.map((step, index) => (
                <Flex key={step.label} vertical align="center" className="flex-1">
                    <Flex align="center" className="w-full">
                        <span
                            className={`h-px flex-1 ${connector(
                                index === 0,
                                index > 0 && steps[index - 1].state === 'done'
                            )}`}
                        />
                        <Marker state={step.state} />
                        <span
                            className={`h-px flex-1 ${connector(
                                index === steps.length - 1,
                                step.state === 'done'
                            )}`}
                        />
                    </Flex>
                    <Typography.Text
                        className={`mt-3 px-1 text-center text-sm ${
                            step.state === 'pending'
                                ? 'text-[#98A2B3]'
                                : 'font-medium text-[#0A0A0A]'
                        }`}
                    >
                        {step.label}
                    </Typography.Text>
                </Flex>
            ))}
        </Flex>
    );
};

export default ReportProgressTracker;
