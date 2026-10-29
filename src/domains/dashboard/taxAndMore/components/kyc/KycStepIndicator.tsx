import { CheckCircleFilled, CheckCircleOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

const STEPS = ['Verify PAN', 'Choose business', 'Finalise setup'];

interface KycStepIndicatorProps {
    currentStep: number;
}

const KycStepIndicator = ({ currentStep }: KycStepIndicatorProps) => (
    <div className="w-full">
        <Flex justify="space-between" align="flex-start" className="w-full">
            {STEPS.map((label, index) => {
                const isCompleted = index < currentStep;
                const isActive = index === currentStep;

                return (
                    <Flex key={label} vertical gap={6} align="center">
                        <Flex gap={6} align="center">
                            {isCompleted ? (
                                <CheckCircleFilled style={{ fontSize: 16, color: '#22c55e' }} />
                            ) : (
                                <CheckCircleOutlined
                                    style={{
                                        fontSize: 16,
                                        color: isActive ? '#FF4F4F' : '#94a3b8',
                                    }}
                                />
                            )}
                            <Typography.Text
                                className={`text-sm ${(() => {
                                    if (isActive) return 'font-medium text-brandColor';
                                    if (isCompleted) return 'font-medium text-valueText';
                                    return 'font-normal text-titleText';
                                })()}`}
                            >
                                {label}
                            </Typography.Text>
                        </Flex>
                        {isActive && (
                            <div
                                className="w-full rounded-full bg-brandColor"
                                style={{ height: 2 }}
                            />
                        )}
                    </Flex>
                );
            })}
        </Flex>
        <div className="w-full bg-slate-200" style={{ height: 1 }} />
    </div>
);

export default KycStepIndicator;
