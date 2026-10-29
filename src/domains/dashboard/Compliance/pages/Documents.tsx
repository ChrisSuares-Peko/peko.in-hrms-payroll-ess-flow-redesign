import { useState } from 'react';

import { Button, Flex, Input, Skeleton, Typography } from 'antd';

import iconDocFile from '../assets/icons/icon-doc-file.svg';
import iconDocFolderOpen from '../assets/icons/icon-doc-folder-open.svg';
import iconDocImport from '../assets/icons/icon-doc-import.svg';
import iconDocSearch from '../assets/icons/icon-doc-search.svg';
import useComplianceDocumentDownload from '../hooks/useComplianceDocumentDownload';
import useComplianceDocuments, {
    ComplianceDocumentGroup,
    ComplianceDocumentItem,
} from '../hooks/useComplianceDocuments';
import useFilter, { COMPLIANCE_FILTER_INITIAL_STATE, type ComplianceFilterState } from '../utils/useFilter';

const { Text, Title } = Typography;

// ─── DocumentCard ─────────────────────────────────────────────────────────────

interface DocumentCardProps {
    doc: ComplianceDocumentItem;
    isDownloading: boolean;
    onDownload: (id: string, url: string, name: string) => void;
}

function DocumentCard({ doc, isDownloading, onDownload }: DocumentCardProps) {
    return (
        <Flex
            vertical
            className="border-[0.5px] border-[#e9ebf0] rounded-[14px] px-[16.5px] py-[14.5px] min-w-0 gap-3 sm:gap-0"
        >
            {/* Top row: icon + text + button (sm) */}
            <Flex align="center" justify="space-between" className="min-w-0">
                <Flex align="center" gap={12} className="min-w-0 flex-1">
                    <img src={iconDocFile} alt="" className="shrink-0 size-8" />
                    <Flex vertical gap={2} className="min-w-0">
                        <Text className="!text-[14px] sm:!text-[18px] !font-semibold !leading-[26px] !text-[#101828] truncate">
                            {doc.name}
                        </Text>
                        {/* Mobile: stacked with dot before date */}
                        <Flex vertical gap={1} className="sm:hidden">
                            <Text className="!text-[12px] !text-[#99a1af] !leading-[18px]">
                                {doc.category}
                            </Text>
                            <Flex align="center" gap={6}>
                                <span className="size-1 rounded-full bg-[#99a1af] shrink-0 inline-block" />
                                <Text className="!text-[12px] !text-[#99a1af] !leading-[18px]">
                                    {doc.date}
                                </Text>
                            </Flex>
                        </Flex>
                        {/* Desktop: inline with dot */}
                        <Flex align="center" gap={6} className="hidden sm:flex">
                            <Text className="!text-[14px] !text-[#99a1af] !leading-[22px] whitespace-nowrap">
                                {doc.category}
                            </Text>
                            <span className="size-1 rounded-full bg-[#99a1af] shrink-0 inline-block" />
                            <Text className="!text-[14px] !text-[#99a1af] !leading-[22px] whitespace-nowrap">
                                {doc.date}
                            </Text>
                        </Flex>
                    </Flex>
                </Flex>

                {/* Button inline on sm+ */}
                <Button
                    loading={isDownloading}
                    disabled={isDownloading}
                    icon={!isDownloading && <img src={iconDocImport} alt="" className="size-[18px]" />}
                    onClick={() => onDownload(doc.id, doc.url, doc.name)}
                    className="!hidden sm:!flex items-center !h-10 !rounded-[8px] !border !border-[#ff4f4f] !text-[#ff4f4f] !text-[15px] !font-normal shrink-0 ml-4"
                >
                    Download
                </Button>
            </Flex>

            {/* Button full-width below on mobile */}
            <Button
                loading={isDownloading}
                disabled={isDownloading}
                icon={!isDownloading && <img src={iconDocImport} alt="" className="size-[18px]" />}
                onClick={() => onDownload(doc.id, doc.url, doc.name)}
                className="sm:!hidden !flex items-center justify-center !w-full !h-8 !rounded-[8px] !border !border-[#ff4f4f] !text-[#ff4f4f] !text-[12px] !font-normal"
            >
                Download
            </Button>
        </Flex>
    );
}

// ─── DocumentGroup ────────────────────────────────────────────────────────────

interface DocumentGroupSectionProps {
    group: ComplianceDocumentGroup;
    loadingId: string | null;
    onDownload: (id: string, url: string, name: string) => void;
}

function DocumentGroupSection({ group, loadingId, onDownload }: DocumentGroupSectionProps) {
    const rows: ComplianceDocumentItem[][] = [];
    for (let i = 0; i < group.documents.length; i += 2) {
        rows.push(group.documents.slice(i, i + 2));
    }

    return (
        <div
            className="border-[0.376px] border-[#e9ebf0] rounded-[32px] w-full overflow-hidden"
            style={{ boxShadow: '0px 2px 20px 0px rgba(0,0,0,0.06)' }}
        >
            {/* Section header */}
            <Flex
                align="center"
                justify="space-between"
                className="px-4 sm:px-8 pt-5 sm:pt-6 pb-5 sm:pb-6 border-b border-b-[#e5e7eb]"
            >
                <Flex align="center" gap={8} className="min-w-0 flex-1 mr-2">
                    <img src={iconDocFolderOpen} alt="" className="size-5 sm:size-6 shrink-0" />
                    <Text className="!text-[13px] sm:!text-[16px] !font-medium !text-[#4a5565] !leading-[20px] sm:!leading-[22px] uppercase tracking-wide">
                        {group.label}
                    </Text>
                </Flex>
                <Flex
                    align="center"
                    gap={2}
                    className="bg-[#f6f9ff] border border-[#e1ebff] rounded-full px-2 py-1 shrink-0"
                >
                    <Text className="!text-[13px] sm:!text-[16px] !font-medium !text-[#2563eb] !leading-[24px] w-5 sm:w-6 text-center">
                        {group.documents.length}
                    </Text>
                    <Text className="!text-[13px] sm:!text-[16px] !text-[#2563eb] !leading-[24px] whitespace-nowrap">
                        Documents
                    </Text>
                </Flex>
            </Flex>

            {/* Document grid */}
            <Flex vertical gap={16} className="px-4 sm:px-8 pt-5 sm:pt-6 pb-6 sm:pb-8">
                {rows.map((row, rowIdx) => (
                    <div key={rowIdx} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {row.map((doc) => (
                            <DocumentCard
                                key={doc.id}
                                doc={doc}
                                isDownloading={loadingId === doc.id}
                                onDownload={onDownload}
                            />
                        ))}
                    </div>
                ))}
            </Flex>
        </div>
    );
}

// ─── Documents ────────────────────────────────────────────────────────────────

export default function Documents() {
    const [filter, setFilter] = useState<ComplianceFilterState>(COMPLIANCE_FILTER_INITIAL_STATE);
    const { handleSearch } = useFilter({ setFilter });

    const { groups, loading } = useComplianceDocuments(filter.searchText);
    const { loadingId, downloadDocument } = useComplianceDocumentDownload();

    const filtered = groups;

    return (
        <Flex vertical gap={36} className="w-full">
            {/* Page heading */}
            <Flex vertical gap={10}>
                <Title
                    level={2}
                    className="!text-[22px] sm:!text-[28px] !font-semibold !leading-[32px] sm:!leading-[38px] !text-[#101828] !m-0"
                >
                    Documents
                </Title>
                <Text className="!text-[14px] sm:!text-[20px] !text-[#6a7282] !leading-[24px] sm:!leading-[32px]">
                    All your compliance documents organized and ready to download
                </Text>
            </Flex>

            {/* Search */}
            <Input
                prefix={
                    <img
                        src={iconDocSearch}
                        alt=""
                        className="size-[18px] mr-1 text-[#a1a1aa]"
                        style={{ filter: 'invert(70%) sepia(5%) saturate(500%) hue-rotate(200deg) brightness(90%) contrast(85%)' }}
                    />
                }
                placeholder="Search Documents..."
                value={filter.searchText}
                onChange={handleSearch}
                className="!h-[50px] !rounded-[8px] !border-[#e4e4e7] !text-[16px] w-full"
            />

            {/* Document groups */}
            <Flex vertical gap={32}>
                {loading && (
                    <Flex vertical gap={32}>
                        <Skeleton active paragraph={{ rows: 4 }} />
                        <Skeleton active paragraph={{ rows: 4 }} />
                    </Flex>
                )}
                {!loading && filtered.length > 0 && (
                    filtered.map((group) => (
                        <DocumentGroupSection
                            key={group.id}
                            group={group}
                            loadingId={loadingId}
                            onDownload={downloadDocument}
                        />
                    ))
                )}
                {!loading && filtered.length === 0 && (
                    <Flex align="center" justify="center" className="py-20">
                        <Text className="!text-[16px] !text-[#99a1af]">
                            {groups.length === 0 ? 'No documents uploaded yet.' : 'No documents found.'}
                        </Text>
                    </Flex>
                )}
            </Flex>
        </Flex>
    );
}
