import { Button, Checkbox, Flex } from 'antd';

import ExpeditedLivePreview from './ExpeditedLivePreview';
import { ExpeditedApplicantDetailsValues } from '../../types';

interface ExpeditedOverviewStepProps {
    values: ExpeditedApplicantDetailsValues;
    isPreviewConfirmed: boolean;
    onConfirmChange: (checked: boolean) => void;
    onEdit: (step: number) => void;
    onBack: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

// Doc §3-4: the overview screen shown before filing, Back returns to the form with data retained
// — same pattern as Protection's own overview step.
const ExpeditedOverviewStep = ({
    values,
    isPreviewConfirmed,
    onConfirmChange,
    onEdit,
    onBack,
    onSubmit,
    isSubmitting,
}: ExpeditedOverviewStepProps) => (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">
        <ExpeditedLivePreview values={values} onEdit={onEdit} />

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

export default ExpeditedOverviewStep;
