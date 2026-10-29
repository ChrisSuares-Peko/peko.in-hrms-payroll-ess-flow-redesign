import { Button, Checkbox, Flex } from 'antd';

import CancellationPreview from './CancellationPreview';
import { GstCancellationValues } from '../../types';

interface CancellationReviewStepProps {
    values: GstCancellationValues;
    businessName: string;
    isPreviewConfirmed: boolean;
    onConfirmChange: (checked: boolean) => void;
    onEdit: (step: number) => void;
    onBack: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

// Step 2 (GST_Registration_Cancellation_Work_Flow.docx §A3/§G) — mirrors ObjectionReviewStep.tsx's
// structure exactly: summary card, confirm checkbox, Back/Submit row.
const CancellationReviewStep = ({
    values,
    businessName,
    isPreviewConfirmed,
    onConfirmChange,
    onEdit,
    onBack,
    onSubmit,
    isSubmitting,
}: CancellationReviewStepProps) => (
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
            <CancellationPreview values={values} businessName={businessName} onEdit={onEdit} />
        </Flex>

        <Checkbox checked={isPreviewConfirmed} onChange={e => onConfirmChange(e.target.checked)}>
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
                disabled={!isPreviewConfirmed}
                loading={isSubmitting}
                onClick={onSubmit}
            >
                Submit Cancellation
            </Button>
        </Flex>
    </div>
);

export default CancellationReviewStep;
