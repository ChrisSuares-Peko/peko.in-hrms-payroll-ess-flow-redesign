import { PlusOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';

import { MY_CARDS_COPY } from '../../../utils/myCardsData';

const { Title } = Typography;

interface MyCardsHeaderProps {
    onRequestCard?: () => void;
    requestCardLoading?: boolean;
}

/** Cardholder "My cards" page header: title/subtitle, and a request-card action. */
const MyCardsHeader = ({ onRequestCard, requestCardLoading }: MyCardsHeaderProps) => (
    <div className="mt-5 flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-1">
                <Title level={3} className="!mb-0 !text-textHeadings">
                    {MY_CARDS_COPY.title}
                </Title>
                <Typography.Text className="text-sm text-textBody">
                    {MY_CARDS_COPY.subtitle}
                </Typography.Text>
            </div>

            <Button
                type="primary"
                icon={<PlusOutlined />}
                className="font-medium"
                loading={requestCardLoading}
                onClick={onRequestCard}
            >
                {MY_CARDS_COPY.requestCard}
            </Button>
        </div>
    </div>
);

export default MyCardsHeader;
