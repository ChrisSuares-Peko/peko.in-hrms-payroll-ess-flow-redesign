import { CheckCircleFilled, CheckCircleOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

const STEPS = [
    { id: 1, label: 'PAN Verification' },
    { id: 2, label: 'Bank Verification' },
    { id: 3, label: 'Consent & Confirm' },
] as const;

const OnboardingStepIndicator = ({ step }: { step: 1 | 2 | 3 | 4 }) => (
    <Flex align="center" gap={0} className="border-b border-[#D7E2F0]">
        {STEPS.map(s => (
            <Flex
                key={s.id}
                align="center"
                justify="center"
                gap={6}
                className="min-w-0 flex-1 pb-[10px] px-2"
                style={{
                    borderBottom: step === s.id ? '2px solid #FF4D4F' : '2px solid transparent',
                    marginBottom: -1,
                }}
            >
                {step > s.id ? (
                    <CheckCircleFilled style={{ fontSize: 12, color: '#FF4D4F', flexShrink: 0 }} />
                ) : (
                    <CheckCircleOutlined
                        style={{
                            fontSize: 12,
                            color: step === s.id ? '#FF4D4F' : '#98A2B3',
                            flexShrink: 0,
                        }}
                    />
                )}
                <Typography.Text
                    className="min-w-0 whitespace-normal text-[11px] font-medium leading-[1.25] sm:text-[12px] sm:leading-none"
                    style={{ color: step === s.id ? '#FF4D4F' : '#667085' }}
                >
                    {s.label}
                </Typography.Text>
            </Flex>
        ))}
    </Flex>
);

export default OnboardingStepIndicator;
