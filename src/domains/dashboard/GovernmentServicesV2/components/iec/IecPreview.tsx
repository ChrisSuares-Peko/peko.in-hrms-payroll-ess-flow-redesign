import { Button, Flex, Typography } from 'antd';
import dayjs from 'dayjs';

import { IecApplicantDetailsValues } from '../../types';

const { Text } = Typography;

interface IecPreviewProps {
    values: IecApplicantDetailsValues;
    businessName: string;
    authorizedPersonLabel: string;
    onEdit: (step: number) => void;
}

const PreviewRow = ({ label, value }: { label: string; value?: string | null }) => (
    <Flex vertical gap={2} className="min-w-0">
        <Text className="!text-[14px] !leading-[16px] !text-[#94a3b8]">{label}</Text>
        <Text className="!text-[14px] !text-[#1e293b] break-words">{value || '—'}</Text>
    </Flex>
);

const BulletRow = ({ label, items }: { label: string; items: string[] }) => (
    <Flex vertical gap={2} className="min-w-0">
        <Text className="!text-[14px] !leading-[16px] !text-[#94a3b8]">{label}</Text>
        {items.length > 0 ? (
            <ul className="!m-0 !pl-4">
                {items.map((item) => (
                    <li key={item} className="!text-[14px] !text-[#1e293b]">
                        {item}
                    </li>
                ))}
            </ul>
        ) : (
            <Text className="!text-[14px] !text-[#1e293b]">—</Text>
        )}
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

// Doc §6.4/§8 — the right-hand live preview, reused here as the Preview step's read-only
// summary. Empty import/export/others rows stay off the preview when that sector isn't
// selected, matching the form's own sector visibility (doc §3).
const IecPreview = ({ values, businessName, authorizedPersonLabel, onEdit }: IecPreviewProps) => (
    <Flex vertical gap={20}>
        <Flex vertical gap={12}>
            <SectionHeader title="Application Details" onEdit={() => onEdit(0)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PreviewRow label="Business Name" value={businessName} />
                <PreviewRow label="Authorized Person" value={authorizedPersonLabel} />
                <BulletRow label="Preferred Sectors" items={values.preferredSectors} />
                {values.preferredSectors.includes('Import') && (
                    <BulletRow label="Import Details" items={values.importDetails} />
                )}
                {values.preferredSectors.includes('Export') && (
                    <BulletRow label="Export Details" items={values.exportDetails} />
                )}
                {values.preferredSectors.includes('Others') && (
                    <BulletRow label="Others Details" items={values.othersDetails} />
                )}
                <PreviewRow
                    label="Verification"
                    value={
                        authorizedPersonLabel
                            ? `I, ${authorizedPersonLabel.toUpperCase()}, solemnly affirm and declare that the information submitted herein is authentic, accurate, and complete to the best of my knowledge and belief. This document, prepared on the basis of the provided information, is intended for submission to the relevant regulatory authorities. I confirm that I have thoroughly reviewed and understood all the contents of this document prior to its filing.`
                            : undefined
                    }
                />
                <PreviewRow label="Date" value={dayjs().format('DD-MM-YYYY')} />
            </div>
        </Flex>
    </Flex>
);

export default IecPreview;
