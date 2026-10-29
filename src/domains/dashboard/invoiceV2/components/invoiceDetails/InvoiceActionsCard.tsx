import { LinkOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';

interface Props {
    isGeneratingLink: boolean;
    onGeneratePaymentLink: () => void;
    invoiceStatus?: string;
}

const InvoiceActionsCard = ({ isGeneratingLink, onGeneratePaymentLink, invoiceStatus }: Props) => (
        <Card className="w-full rounded-2xl" styles={{ body: { padding: 12 } }}>
            <div className="grid grid-cols-1 gap-2">
                {invoiceStatus !== 'PAID' && (
                    <Button
                        icon={<LinkOutlined />}
                        loading={isGeneratingLink}
                        onClick={onGeneratePaymentLink}
                        block
                    >
                        Generate Payment Link
                    </Button>
                )}
            </div>
        </Card>
    );

export default InvoiceActionsCard;
