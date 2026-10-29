import { Flex, Typography } from 'antd';

interface TimelineStep {
    label: string;
    time: string;
    color: string;
}

interface TransactionTimelineProps {
    timeline: TimelineStep[];
}

const PLACEHOLDER_TIMES = new Set(['—', 'N/A', 'Awaiting settlement', 'Not applicable']);
const COMPLETED_COLOR = '#16A34A';
const PENDING_COLOR = '#9CA3AF';
const CONNECTOR_PENDING = '#D1D5DB';

const isStepCompleted = (step: TimelineStep) => {
    const value = String(step?.time || '').trim();
    return value.length > 0 && !PLACEHOLDER_TIMES.has(value);
};

const TransactionTimeline = ({ timeline }: TransactionTimelineProps) => (
    <div className="rounded-2xl p-5 !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
        <Flex vertical gap={20}>
            <Typography.Text className="font-bold text-base">Transaction Timeline</Typography.Text>
            <div className="relative pl-2">
                {timeline.map((step, idx) => (
                    <div key={idx} className="relative flex gap-4">
                        {/* Dot + connector line */}
                        <div className="flex flex-col items-center" style={{ width: 20, flexShrink: 0 }}>
                            {(() => {
                                const isCompleted = isStepCompleted(step);
                                const nextStep = timeline[idx + 1];
                                const isNextCompleted = nextStep ? isStepCompleted(nextStep) : false;
                                const connectorColor =
                                    isCompleted && isNextCompleted ? COMPLETED_COLOR : CONNECTOR_PENDING;

                                return (
                                    <>
                                        <div
                                            className="rounded-full z-10"
                                            style={{
                                                width: 14,
                                                height: 14,
                                                background: isCompleted ? COMPLETED_COLOR : PENDING_COLOR,
                                                marginTop: 3,
                                                flexShrink: 0,
                                            }}
                                        />
                                        {idx < timeline.length - 1 && (
                                            <div
                                                style={{
                                                    width: 2,
                                                    flex: 1,
                                                    minHeight: 32,
                                                    background: connectorColor,
                                                    marginTop: 2,
                                                }}
                                            />
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                        {/* Label + time */}
                        <Flex
                            vertical
                            gap={2}
                            style={{ paddingBottom: idx < timeline.length - 1 ? 24 : 0 }}
                        >
                            <Typography.Text
                                className="font-semibold text-sm"
                                style={{ color: isStepCompleted(step) ? COMPLETED_COLOR : PENDING_COLOR }}
                            >
                                {step.label}
                            </Typography.Text>
                            <Typography.Text
                                className="text-xs"
                                style={{ color: isStepCompleted(step) ? '#4B5563' : '#9CA3AF' }}
                            >
                                {step.time}
                            </Typography.Text>
                        </Flex>
                    </div>
                ))}
            </div>
        </Flex>
    </div>
);

export default TransactionTimeline;
