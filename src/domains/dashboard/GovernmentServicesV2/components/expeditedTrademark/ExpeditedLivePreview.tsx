import { Button, Flex, Typography } from 'antd';

import { ExpeditedApplicantDetailsValues } from '../../types';

const { Text } = Typography;

interface ExpeditedLivePreviewProps {
    values: ExpeditedApplicantDetailsValues;
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

// Doc §3: shown beside the form the whole time (same live-alongside pattern as Protection's own
// preview, not gated behind a final step). Verification is generated from the Authorized Person,
// not the Applicant Name — the one difference from Protection's own verification statement.
const ExpeditedLivePreview = ({ values, onEdit }: ExpeditedLivePreviewProps) => {
    const verification = values.authorizedPerson
        ? `I, ${values.authorizedPerson}, solemnly affirm and declare that the information submitted herein is authentic, accurate, and complete to the best of my knowledge and belief.`
        : '';

    return (
        <Flex
            vertical
            gap={16}
            className="p-6"
            style={{
                border: '1px solid #F0F0F0',
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
        >
            <SectionHeader title="Application Details" onEdit={() => onEdit(0)} />
            <PreviewRow label="Application Number" value={values.applicationNumber} />
            <PreviewRow label="Brand" value={values.brand} />
            <PreviewRow label="Class" value={values.trademarkClass} />
            <PreviewRow label="Application Date" value={values.applicationDate} />
            <PreviewRow label="Entity Type" value={values.entityType} />
            <PreviewRow label="Applicant Name" value={values.applicantName} />
            <PreviewRow label="Applicant Address" value={values.applicantAddress} />
            <PreviewRow label="Declaration of Reason" value={values.declarationReason} />
            <PreviewRow label="Verification" value={verification} />
        </Flex>
    );
};

export default ExpeditedLivePreview;
