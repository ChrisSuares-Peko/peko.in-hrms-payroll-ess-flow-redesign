import { Button, Checkbox, Flex, Typography } from 'antd';

import { ApplicantDetailsValues } from '../types';
import TrademarkPreview from './TrademarkPreview';

const { Text } = Typography;

interface TrademarkReviewStepProps {
    values: ApplicantDetailsValues;
    ownerName: string;
    logoFileName: string;
    isPreviewConfirmed: boolean;
    onConfirmChange: (checked: boolean) => void;
    onEdit: (step: number) => void;
    onBack: () => void;
    onSubmit: () => void;
    isSubmittingFiling: boolean;
    engagementId: string | null;
}

// Step 4 (Preview): summary card, confirm checkbox, Back/Submit row, and the payment-pending notice.
const TrademarkReviewStep = ({
    values,
    ownerName,
    logoFileName,
    isPreviewConfirmed,
    onConfirmChange,
    onEdit,
    onBack,
    onSubmit,
    isSubmittingFiling,
    engagementId,
}: TrademarkReviewStepProps) => (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">
        <Flex
            vertical
            gap={20}
            className="py-6 px-6 sm:px-10"
            style={{
                border: '1px solid #F0F0F0',
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
        >
            <TrademarkPreview values={values} ownerName={ownerName} logoFileName={logoFileName} onEdit={onEdit} />
        </Flex>

        <Checkbox checked={isPreviewConfirmed} onChange={(e) => onConfirmChange(e.target.checked)}>
            I confirm the details above are correct.
        </Checkbox>

        <Flex justify="space-between" gap={12}>
            <Button danger size="large" className="!min-w-[140px]" onClick={onBack}>
                Back
            </Button>
            <Button
                type="primary"
                danger
                size="large"
                className="!min-w-[140px]"
                disabled={!isPreviewConfirmed || !engagementId}
                loading={isSubmittingFiling}
                onClick={onSubmit}
            >
                Submit Application
            </Button>
        </Flex>
        {!engagementId && (
            <Text type="danger" className="!text-xs text-right">
                Payment for this application hasn&apos;t completed yet — submission isn&apos;t available until then.
            </Text>
        )}
    </div>
);

export default TrademarkReviewStep;
