import { SwapOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Typography } from 'antd';

interface ConvertDocumentCardProps {
    title: string;
    description: string;
    onConvert: () => void;
}

const ConvertDocumentCard = ({ title, description, onConvert }: ConvertDocumentCardProps) => (
    <Card className="rounded-2xl border border-[#E4E7EC] shadow-none [&_.ant-card-body]:p-4">
        <Flex align="center" gap={12}>
            <Flex
                align="center"
                justify="center"
                className="h-10 w-10 shrink-0 rounded-xl bg-[#FFF1F0]"
            >
                <SwapOutlined className="text-base text-[#FF4F4F]" />
            </Flex>
            <Flex vertical gap={2} className="flex-1 min-w-0">
                <Typography.Text className="text-sm font-semibold text-[#101828]">
                    {title}
                </Typography.Text>
                <Typography.Text className="text-xs text-[#667085]">{description}</Typography.Text>
            </Flex>
            <Button
                type="primary"
                className="shrink-0 bg-[#FF4F4F] border-[#FF4F4F] hover:!bg-[#e64444] hover:!border-[#e64444] text-sm font-medium"
                onClick={onConvert}
            >
                {title}
            </Button>
        </Flex>
    </Card>
);

export default ConvertDocumentCard;
