import { LinkOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';

interface Props {
    isGeneratingLink: boolean;
    onGeneratePaymentLink: () => void;
    documentStatus?: string;
}

// Invoice-only quick action card (Generate Payment Link). Sits alongside the
// existing CollectPayment tile grid below it, which stays untouched — that
// grid already covers the fuller set of collection methods (bank transfer,
// eNACH, etc.) and is preserved per the "don't remove existing type-specific
// features" rule. "Create Payment Link" appears in both places; that overlap
// is accepted so the actions-card pattern itself is genuinely ported rather
// than only conceptually approximated by the tile grid.
const DocumentActionsCard = ({ isGeneratingLink, onGeneratePaymentLink, documentStatus }: Props) => (
    <Card className="w-full rounded-2xl" styles={{ body: { padding: 12 } }}>
        <div className="grid grid-cols-1 gap-2">
            {documentStatus !== 'PAID' && (
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

export default DocumentActionsCard;
