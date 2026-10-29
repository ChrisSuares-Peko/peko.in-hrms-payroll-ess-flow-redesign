import { Flex, Typography } from 'antd';

import KycStepIndicator from './KycStepIndicator';

interface KycPageLayoutProps {
    currentStep: number;
    children: React.ReactNode;
}

const KycPageLayout = ({ currentStep, children }: KycPageLayoutProps) => (
    <Flex vertical gap={24} className="min-h-full">
        <Flex justify="center" align="flex-start" className="w-full py-4">
            <Flex
                vertical
                gap={20}
                className="w-full bg-white rounded-[16px] px-5 py-5"
                style={{
                    maxWidth: 600,
                    boxShadow: '0px 1.5px 16.5px 0px rgba(0,0,0,0.06)',
                }}
            >
                <Flex vertical gap={2}>
                    <Typography.Title
                        level={5}
                        className="!mb-0 !font-semibold"
                        style={{ color: '#1e293b' }}
                    >
                        Get started with Tax &amp; More
                    </Typography.Title>
                    <Typography.Text className="text-sm" style={{ color: '#6a7282' }}>
                        One-time setup to access GST, TDS, and Income Tax.
                    </Typography.Text>
                </Flex>

                <KycStepIndicator currentStep={currentStep} />

                <div className="w-full">{children}</div>
            </Flex>
        </Flex>
    </Flex>
);

export default KycPageLayout;
