import { Button, Checkbox, Flex } from 'antd';

import IecPreview from './IecPreview';
import { IecApplicantDetailsValues } from '../../types';

interface IecReviewStepProps {
    values: IecApplicantDetailsValues;
    businessName: string;
    authorizedPersonLabel: string;
    isPreviewConfirmed: boolean;
    isSubmitting: boolean;
    onConfirmChange: (checked: boolean) => void;
    onEdit: (step: number) => void;
    onBack: () => void;
    onFileApplication: () => void;
}

// Doc §5 Step 6 — summary card, confirm checkbox, Back/File Application row. "File Application"
// submits the SmartForm payload directly, same as Trademark Registration/Objection — no OTP/email
// confirmation step.
const IecReviewStep = ({
    values,
    businessName,
    authorizedPersonLabel,
    isPreviewConfirmed,
    isSubmitting,
    onConfirmChange,
    onEdit,
    onBack,
    onFileApplication,
}: IecReviewStepProps) => (
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
            <IecPreview
                values={values}
                businessName={businessName}
                authorizedPersonLabel={authorizedPersonLabel}
                onEdit={onEdit}
            />
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
                className="!min-w-[180px]"
                disabled={!isPreviewConfirmed}
                loading={isSubmitting}
                onClick={onFileApplication}
            >
                File Application
            </Button>
        </Flex>
    </div>
);

export default IecReviewStep;
