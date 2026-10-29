import { DownloadOutlined } from '@ant-design/icons';
import { Button, Flex, Tooltip } from 'antd';

interface Props {
    onView: () => void;
    onDownload: () => void;
    // Only a finished report can be downloaded.
    canDownload: boolean;
}

// The two small outlined actions in the order-history ACTION column.
const OrderActionButtons = ({ onView, onDownload, canDownload }: Props) => (
    <Flex gap={8}>
        <Tooltip title={canDownload ? 'Download report' : 'Available once the report is ready'}>
            <Button
                danger
                size="small"
                icon={<DownloadOutlined />}
                disabled={!canDownload}
                onClick={onDownload}
            />
        </Tooltip>
        <Button danger size="small" onClick={onView}>
            View
        </Button>
    </Flex>
);

export default OrderActionButtons;
