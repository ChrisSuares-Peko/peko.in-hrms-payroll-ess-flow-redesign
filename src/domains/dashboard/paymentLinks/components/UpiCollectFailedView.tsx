import { CloseCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

interface UpiCollectFailedViewProps {
    onChooseAnother: () => void;
    onRetry: () => void;
}

const UpiCollectFailedView = ({ onChooseAnother, onRetry }: UpiCollectFailedViewProps) => (
    <Flex vertical gap={24} align="center" className="pt-4 pb-2">
        {/* Red concentric circles */}
        <div className="relative flex items-center justify-center">
            <div className="rounded-full" style={{ width: 100, height: 100, background: 'rgba(239,68,68,0.1)' }} />
            <div className="rounded-full absolute" style={{ width: 76, height: 76, background: 'rgba(239,68,68,0.2)' }} />
            <div
                className="rounded-full absolute flex items-center justify-center"
                style={{ width: 54, height: 54, background: '#EF4444' }}
            >
                <CloseCircleOutlined style={{ color: '#fff', fontSize: 24 }} />
            </div>
        </div>

        <Flex vertical gap={8} align="center">
            <Typography.Title level={3} className="!mb-0 !font-bold text-center">
                Payment Failed
            </Typography.Title>
            <Typography.Text className="font-semibold text-gray-500 text-center">
                We could not process your payment. Please try again.
            </Typography.Text>
        </Flex>

        <Flex gap={12} wrap="wrap" className="w-full">
            <Button size="large" className="flex-1" onClick={onChooseAnother}>
                Choose Another Payment Method
            </Button>
            <Button
                size="large"
                className="flex-1"
                style={{ color: '#EF4444', borderColor: '#EF4444' }}
                icon={
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 .49-4" />
                    </svg>
                }
                onClick={onRetry}
            >
                Retry Payment
            </Button>
        </Flex>

        <Typography.Text className="text-gray-400 text-sm text-center">
            Need help? Contact support at{' '}
            <span style={{ color: '#374151' }}>reach@peko.one</span>
        </Typography.Text>
    </Flex>
);

export default UpiCollectFailedView;
