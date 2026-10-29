import { CloseCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

import UnlockedInsights from './UnlockedInsights';
import { insightsHeader } from '../../utils/insightsData';

const { Title } = Typography;

interface InsightsPanelProps {
    onClose: () => void;
}

const InsightsPanel = ({ onClose }: InsightsPanelProps) => (
    <div className="w-full shrink-0 xl:w-96">
        <Flex vertical className="overflow-hidden rounded-2xl border border-borderSubtle bg-white">
            <Flex align="center" justify="space-between" className="px-5 pb-3 pt-5">
                <Title level={5} className="!mb-0 !text-lg !font-semibold !text-ink">
                    {insightsHeader.title}
                </Title>
                <Button
                    type="text"
                    shape="circle"
                    aria-label="Close insights"
                    icon={<CloseCircleOutlined className="text-base" />}
                    onClick={onClose}
                    className="!text-muted hover:!text-ink"
                />
            </Flex>

            <div className="px-5 pb-5">
                <UnlockedInsights />
            </div>
        </Flex>
    </div>
);

export default InsightsPanel;
