import { Button, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { insightsPremium } from '../../utils/insightsData';

const { Title, Text } = Typography;

const SKELETON_BLOCKS = [120, 96, 200, 140, 168, 112];

const LockedInsights = () => {
    const navigate = useNavigate();

    return (
        <div className="relative">
            <Flex
                vertical
                gap={16}
                aria-hidden
                className="pointer-events-none select-none px-5 pb-5 pt-1 opacity-40 blur-sm"
            >
                {SKELETON_BLOCKS.map(h => (
                    <div
                        key={h}
                        className="w-full rounded-2xl bg-surfaceGray"
                        style={{ height: h }}
                    />
                ))}
            </Flex>

            <div className="pointer-events-none absolute inset-x-0 top-0 flex min-h-[80vh] items-center justify-center px-4">
                <Flex
                    vertical
                    align="center"
                    gap={16}
                    className="pointer-events-auto w-full max-w-xs rounded-2xl border border-borderSubtle bg-white p-6 text-center shadow-lg"
                >
                    <Flex vertical gap={6}>
                        <Title level={5} className="!mb-0 !text-xl !font-semibold !text-ink">
                            {insightsPremium.title}
                        </Title>
                        <Text className="text-sm text-muted">{insightsPremium.description}</Text>
                    </Flex>
                    <Button
                        type="primary"
                        danger
                        size="large"
                        block
                        onClick={() => navigate('/plans')}
                    >
                        {insightsPremium.ctaLabel}
                    </Button>
                    <Text className="text-xs text-muted">{insightsPremium.note}</Text>
                </Flex>
            </div>
        </div>
    );
};

export default LockedInsights;
