import { Button, Flex } from 'antd';

interface UpiCollectFormActionsProps {
    loading?: boolean;
    onCancel: () => void;
}

const UpiCollectFormActions = ({ loading, onCancel }: UpiCollectFormActionsProps) => (
    <Flex gap={12} wrap="wrap">
        <Button size="large" className="flex-1" onClick={onCancel}>
            Cancel
        </Button>
        <Button type="primary" danger size="large" className="flex-1" loading={loading} htmlType="submit">
            Send UPI Request
        </Button>
    </Flex>
);

export default UpiCollectFormActions;
