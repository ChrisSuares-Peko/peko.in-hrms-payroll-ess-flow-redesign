import { Button, Checkbox, Flex } from 'antd';

import ObjectionPreview from './ObjectionPreview';
import { ObjectionApplicantDetailsValues } from '../../types';

interface ObjectionReviewStepProps {
    values: ObjectionApplicantDetailsValues;
    authorizedPersonLabel: string;
    isPreviewConfirmed: boolean;
    onConfirmChange: (checked: boolean) => void;
    onEdit: (step: number) => void;
    onBack: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

// Step 3 (doc §8): summary card, confirm checkbox, Back/Submit row — mirrors
// TrademarkReviewStep.tsx's structure exactly.
const ObjectionReviewStep = ({
    values,
    authorizedPersonLabel,
    isPreviewConfirmed,
    onConfirmChange,
    onEdit,
    onBack,
    onSubmit,
    isSubmitting,
}: ObjectionReviewStepProps) => (
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
            <ObjectionPreview
                values={values}
                authorizedPersonLabel={authorizedPersonLabel}
                onEdit={onEdit}
            />
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
                Submit Application
            </Button>
        </Flex>
    </div>
);

export default ObjectionReviewStep;
