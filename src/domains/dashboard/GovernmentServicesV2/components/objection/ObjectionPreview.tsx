import { Button, Flex, Typography } from 'antd';

import { ObjectionApplicantDetailsValues } from '../../types';
import { OBJECTION_SECTION_OPTIONS, PROOF_AVAILABLE_OPTIONS } from '../../utils/objectionForm';

const { Text } = Typography;

interface ObjectionPreviewProps {
    values: ObjectionApplicantDetailsValues;
    authorizedPersonLabel: string;
    onEdit: (step: number) => void;
}

const PreviewRow = ({ label, value }: { label: string; value?: string | null }) => (
    <Flex vertical gap={2} className="min-w-0">
        <Text className="!text-[14px] !leading-[16px] !text-[#94a3b8]">{label}</Text>
        <Text className="!text-[14px] !text-[#1e293b] break-words">{value || '—'}</Text>
    </Flex>
);

const SectionHeader = ({ title, onEdit }: { title: string; onEdit: () => void }) => (
    <Flex justify="space-between" align="center">
        <Text strong className="!text-[16px] !text-[#1e293b]">
            {title}
        </Text>
        <Button type="link" onClick={onEdit} className="!p-0 !h-auto !text-[#ff4f4f]">
            Edit
        </Button>
    </Flex>
);

// Read-only summary of Step 1 (Application Details) + Step 2 (Documents), mirroring
// TrademarkPreview.tsx's pattern. onEdit(step) jumps the page's currentStep back.
const ObjectionPreview = ({ values, authorizedPersonLabel, onEdit }: ObjectionPreviewProps) => {
    const objectionSectionLabels = values.objectionSections
        .map(
            value =>
                OBJECTION_SECTION_OPTIONS.find(option => option.value === value)?.label ?? value
        )
        .join(', ');
    const proofAvailableLabel = values.proofAvailable
        .map(
            value => PROOF_AVAILABLE_OPTIONS.find(option => option.value === value)?.label ?? value
        )
        .join(', ');

    return (
        <Flex vertical gap={20}>
            <Flex vertical gap={12}>
                <SectionHeader title="Application Details" onEdit={() => onEdit(0)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PreviewRow label="Application Number" value={values.applicationNumber} />
                    <PreviewRow label="Brand" value={values.brand} />
                    <PreviewRow label="Class" value={values.trademarkClass} />
                    <PreviewRow label="Application Date" value={values.applicationDate} />
                    <PreviewRow label="Notice Date" value={values.noticeDate} />
                    <PreviewRow label="Applicant Name" value={values.applicantName} />
                    <PreviewRow label="Applicant Address" value={values.applicantAddress} />
                    <PreviewRow label="Salutation" value={values.salutation} />
                    <PreviewRow label="Authorized Person" value={authorizedPersonLabel} />
                    <PreviewRow label="Objection Section" value={objectionSectionLabels} />
                    <PreviewRow label="Proof Available" value={proofAvailableLabel} />
                </div>
            </Flex>
        </Flex>
    );
};

export default ObjectionPreview;
