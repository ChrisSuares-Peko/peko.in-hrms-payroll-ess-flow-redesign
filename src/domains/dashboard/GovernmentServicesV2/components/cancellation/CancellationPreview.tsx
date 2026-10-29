import { Button, Flex, Typography } from 'antd';

import { GstCancellationValues } from '../../types';

const { Text } = Typography;

interface CancellationPreviewProps {
    values: GstCancellationValues;
    businessName: string;
    onEdit: (step: number) => void;
}

const PreviewRow = ({
    label,
    value,
    valueClassName = '!text-[#1e293b]',
}: {
    label: string;
    value?: string | null;
    valueClassName?: string;
}) => (
    <Flex vertical gap={2} className="min-w-0">
        <Text className="!text-[14px] !leading-[16px] !text-[#94a3b8]">{label}</Text>
        <Text className={`!text-[14px] break-words ${valueClassName}`}>{value || '—'}</Text>
    </Flex>
);

// Read-only summary of Step 1 (GST_Registration_Cancellation_Work_Flow.docx §A2/§E3) — mirrors
// ObjectionPreview.tsx's pattern. Business Name comes from the pre-payment business selection
// (useCancellationApplicationData), not from this step's own Formik values — Cancellation never
// collects a business field itself (see CancellationDetailsStep's comment).
const CancellationPreview = ({
    values,
    businessName,
    onEdit,
}: CancellationPreviewProps) => {
    const verification = values.authorizedPerson
        ? `I, ${values.salutation} ${values.authorizedPerson}, hereby confirm the above declaration.`
        : '';

    return (
        <Flex vertical gap={20}>
            <Flex justify="space-between" align="center">
                <Text strong className="!text-[16px] !text-[#1e293b]">
                    Cancellation Details
                </Text>
                <Button type="link" onClick={() => onEdit(0)} className="!p-0 !h-auto !text-[#ff4f4f]">
                    Edit
                </Button>
            </Flex>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PreviewRow label="Business Name" value={businessName} />
                <PreviewRow label="Authorized Person" value={values.authorizedPerson} />
                <PreviewRow label="Reason for Cancellation" value={values.reasonForCancellation} />
                <PreviewRow label="Verification" value={verification} />
                <PreviewRow label="Date" value={new Date().toLocaleDateString('en-GB')} />
            </div>
        </Flex>
    );
};

export default CancellationPreview;
