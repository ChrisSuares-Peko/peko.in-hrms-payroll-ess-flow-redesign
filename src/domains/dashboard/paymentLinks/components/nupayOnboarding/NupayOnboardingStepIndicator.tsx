import { CheckCircleFilled, CheckCircleOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

export const NUPAY_ONBOARDING_STEPS = [
    { id: 1, label: 'Basic Information' },
    { id: 2, label: 'Business Details' },
    { id: 3, label: 'Address Fields' },
    { id: 4, label: 'Bank Details' },
    { id: 5, label: 'Documents Upload' },
] as const;

export type NupayOnboardingStep = 1 | 2 | 3 | 4 | 5;

const NupayOnboardingStepIndicator = ({ step }: { step: NupayOnboardingStep }) => (
    <Flex align="center" gap={0} className="border-b border-[#D7E2F0]">
        {NUPAY_ONBOARDING_STEPS.map(s => (
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
                    <CheckCircleFilled style={{ fontSize: 13, color: '#12B76A', flexShrink: 0 }} />
                ) : (
                    <CheckCircleOutlined
                        style={{ fontSize: 13, color: step === s.id ? '#FF4D4F' : '#98A2B3', flexShrink: 0 }}
                    />
                )}
                <Typography.Text
                    className="min-w-0 whitespace-normal text-[12px] font-medium leading-[1.25] sm:leading-none"
                    style={{ color: step === s.id ? '#FF4D4F' : '#667085' }}
                >
                    {s.label}
                </Typography.Text>
            </Flex>
        ))}
    </Flex>
);

export default NupayOnboardingStepIndicator;
