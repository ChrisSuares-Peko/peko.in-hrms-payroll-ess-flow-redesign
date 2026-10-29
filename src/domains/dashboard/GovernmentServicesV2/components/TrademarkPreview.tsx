import { Button, Divider, Flex, Typography } from 'antd';

import { ApplicantDetailsValues } from '../types';

const { Text } = Typography;

interface TrademarkPreviewProps {
    values: ApplicantDetailsValues;
    // Resolved business name for the owner's vendor application_id — resolved by the caller, not looked up here.
    ownerName: string;
    logoFileName: string;
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

// Read-only summary of Steps 1-3, grouped by step; onEdit(step) jumps the page's currentStep back (no step state owned here).
const TrademarkPreview = ({ values, ownerName, logoFileName, onEdit }: TrademarkPreviewProps) => {
    const showTransliteration = Boolean(values.language) && values.language !== 'English';

    return (
        <Flex vertical gap={20}>
            <Flex vertical gap={12}>
                <SectionHeader title="Applicant Details" onEdit={() => onEdit(0)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PreviewRow label="Trademark Owner" value={ownerName} />
                    <PreviewRow label="Entity Type" value={values.entityType} />
                    <PreviewRow label="Salutation" value={values.salutation} />
                    <PreviewRow label="Authorized Person" value={values.authorizedPerson} />
                    <PreviewRow label="Address" value={values.address} />
                    <PreviewRow label="PIN code" value={values.pincode} />
                    <PreviewRow label="State" value={values.state} />
                    <PreviewRow label="District" value={values.district} />
                    <PreviewRow label="Country" value={values.country} />
                </div>
            </Flex>

            <Divider className="!my-0" />

            <Flex vertical gap={12}>
                <SectionHeader title="Trademark Details" onEdit={() => onEdit(1)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PreviewRow label="Brand to be Trademarked" value={values.brand} />
                    <PreviewRow label="Language" value={values.language} />
                    {showTransliteration && (
                        <>
                            <PreviewRow label="Transliteration of the Mark" value={values.transliterationOfMark} />
                            <PreviewRow label="Translation of the Mark" value={values.translationOfMark} />
                        </>
                    )}
                    <PreviewRow label="Main Goods or Service the Brand Represents" value={values.mainGoodsOrService} />
                    <PreviewRow label="Class" value={values.trademarkClass} />
                    <PreviewRow label="Description" value={values.description.join(', ')} />
                    <PreviewRow label="Trademark is in use" value={values.trademarkInUse ? 'Yes' : 'No'} />
                    {values.trademarkInUse && <PreviewRow label="Used Since" value={values.usedSince} />}
                    <PreviewRow label="Associated Marks" value={values.associatedMarks} />
                </div>
            </Flex>

            <Divider className="!my-0" />

            <Flex vertical gap={12}>
                <SectionHeader title="Logo Upload" onEdit={() => onEdit(2)} />
                <PreviewRow label="Logo" value={logoFileName || 'No logo uploaded'} />
            </Flex>
        </Flex>
    );
};

export default TrademarkPreview;
