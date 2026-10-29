import React, { useMemo } from 'react';

import { CheckCircleFilled, DownloadOutlined, EyeOutlined, FilePdfFilled } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import axios from 'axios';

import { SERVER_URL } from '@src/config-global';
import { useAppSelector } from '@src/hooks/store';

import { Application, VendorDocumentField, VendorDocuments, VendorFieldFile } from '../types';
import { ENTITY_TYPES } from '../utils/data';

const { Text } = Typography;

const flattenFields = (vd?: VendorDocuments | null): VendorDocumentField[] =>
    (vd?.sections ?? []).flatMap(section => (section.instances ?? []).flatMap(instance => instance.fields ?? []));

const fieldFile = (field: VendorDocumentField): VendorFieldFile | null =>
    field.type === 'file' && field.value && typeof field.value === 'object'
        ? (field.value as VendorFieldFile)
        : null;

const isRegisteredNameField = (field: VendorDocumentField): boolean =>
    field.type !== 'file' && /registered\s*name|company\s*name/i.test(`${field.label ?? ''} ${field.name ?? ''}`);

const formatBytes = (size?: number): string | undefined => {
    if (size == null) return undefined;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const fileMeta = (file: VendorFieldFile): string => {
    let ext: string | undefined;
    if (file.extension) ext = file.extension.toUpperCase();
    else if (file.type) ext = String(file.type).split('/').pop()?.toUpperCase();
    return [ext, formatBytes(file.size)].filter(Boolean).join(' • ');
};

const formatINR = (value?: number): string | undefined =>
    value == null ? undefined : `₹ ${Number(value).toLocaleString('en-IN')}`;

const initials = (name: string): string =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase();

const saveBlob = (blob: Blob, fileName: string) => {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
};

const Particular: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <Text className="!text-[14px] !text-[#8b8b8b] !leading-[22px]">{label}</Text>
            <Text className="!text-[16px] !font-medium !text-[#1e293b] !leading-6 break-words">{value}</Text>
        </div>
    );
};

interface CompanyDetailsCardProps {
    application: Application;
}

const CompanyDetailsCard: React.FC<CompanyDetailsCardProps> = ({ application }) => {
    const { id: userId, role: userType, token, sessionId } = useAppSelector(s => s.reducer.auth);
    const fields = useMemo(() => flattenFields(application.vendorDocuments), [application.vendorDocuments]);

    const downloadFile = async (fieldId: string, fileName: string, fallbackUrl: string) => {
        try {
            const res = await axios.get(
                `${userType}/${userId}/officeAndBusiness/company-incorporation/applications/${encodeURIComponent(application.applicationId)}/documents/download`,
                {
                    baseURL: SERVER_URL,
                    params: { fieldId },
                    responseType: 'blob',
                    headers: { Authorization: `Bearer ${token}`, sessionid: sessionId },
                },
            );
            saveBlob(res.data as Blob, fileName);
        } catch {
            window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const nameField = fields.find(isRegisteredNameField);
    const companyName =
        application.approvedCompanyName ||
        (nameField && typeof nameField.value === 'string' && nameField.value) ||
        application.proposedNames?.firstChoice ||
        '—';
    const companyType =
        ENTITY_TYPES.find(t => t.value === application.entityType)?.label || application.entityType;

    // Date of Incorporation = date of the completed "registered" vendor stage.
    const registeredStage = (application.vendorStages ?? []).find(
        s => s.state === 'completed' && /registered|incorporat|success/i.test(`${s.title ?? ''} ${s.description ?? ''}`),
    );
    const dateOfIncorporation = registeredStage?.date
        ? new Date(registeredStage.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : undefined;

    // Known particulars come from our application API; CIN/PAN/TAN/ROC etc. are
    // shown only when the vendor returns them as text fields in vendorDocuments.
    const particulars = useMemo(() => {
        const vendorParticulars = fields
            .filter(f => f.type !== 'file' && f !== nameField && f.value != null && String(f.value).trim() !== '')
            .map(f => ({ label: f.label ?? f.name ?? 'Field', value: String(f.value) }));

        const seen = new Set(vendorParticulars.map(p => p.label.toLowerCase()));
        const modelParticulars = [
            { label: 'Company Type', value: companyType },
            { label: 'Date of Incorporation', value: dateOfIncorporation },
            { label: 'Authorised Capital', value: formatINR(application.capital?.authorizedCapital) },
            { label: 'Paid-up Capital', value: formatINR(application.capital?.paidUpCapital) },
            { label: 'Registered Office', value: application.registeredOffice?.address || undefined },
        ].filter(p => p.value && !seen.has(p.label.toLowerCase()));

        return [...vendorParticulars, ...modelParticulars];
    }, [fields, nameField, companyType, dateOfIncorporation, application.capital, application.registeredOffice]);

    const documents = useMemo(
        () =>
            fields
                .map(field => ({ field, file: fieldFile(field) }))
                .filter((x): x is { field: VendorDocumentField; file: VendorFieldFile } => !!x.file?.url)
                .map(x => ({
                    title: x.field.label ?? x.file.name ?? 'Document',
                    fileName: x.file.name ?? x.field.label ?? 'document',
                    fieldId: String(x.field.field ?? x.field.name ?? ''),
                    url: x.file.url as string,
                    meta: fileMeta(x.file),
                })),
        [fields],
    );

    const directors = application.directors ?? [];

    return (
        <div className="bg-white border border-[#f1f1f1] rounded-[24px] sm:rounded-[36px] shadow-[0px_1.2px_12px_0px_rgba(0,0,0,0.06)] p-4 sm:p-14 flex flex-col gap-8">
            <div className="flex flex-col gap-1">
                <Text className="!text-[20px] sm:!text-[24px] !font-semibold !text-[#0a0a0a] !leading-8">
                    Company Details &amp; Documents
                </Text>
                <Text className="!text-[14px] sm:!text-[16px] !text-[#64748b] !leading-6">
                    Your registered company particulars and official documents
                </Text>
            </div>

            {/* Registered Particulars */}
            <div className="flex flex-col gap-4 w-full">
                <Text className="!text-[18px] sm:!text-[20px] !font-semibold !text-[#64748b] !leading-7">
                    Registered Particulars
                </Text>
                <div className="bg-white border border-[#d3d3d3] rounded-[24px] px-5 sm:px-8 pt-6 pb-8 flex flex-col gap-8">
                    <Flex align="center" justify="space-between" gap={12} wrap="wrap">
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <Text className="!text-[14px] !text-[#64748b] !leading-[22px]">Company Name</Text>
                            <Text className="!text-[16px] sm:!text-[18px] !font-semibold !text-[#0a0a0a] !leading-[26px] break-words">
                                {companyName}
                            </Text>
                        </div>
                        <Flex
                            gap={6}
                            align="center"
                            className="border border-[#43b75d] rounded-full px-3 py-1.5 flex-shrink-0"
                        >
                            <CheckCircleFilled className="!text-[#43b75d] text-[14px]" />
                            <Text className="!text-[14px] !text-[#43b75d] !leading-[22px]">Verified</Text>
                        </Flex>
                    </Flex>
                    {particulars.length > 0 && (
                        <>
                            <div className="h-px w-full bg-[#ececec]" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                                {particulars.map(p => (
                                    <Particular key={p.label} label={p.label} value={p.value} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Directors & DIN */}
            {directors.length > 0 && (
                <div className="flex flex-col gap-4 w-full">
                    <Text className="!text-[18px] sm:!text-[20px] !font-semibold !text-[#64748b] !leading-7">
                        Directors &amp; DIN
                    </Text>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {directors.map((director, idx) => (
                            <Flex
                                key={`${director.name}-${idx}`}
                                align="center"
                                justify="space-between"
                                gap={12}
                                className="bg-white border border-[#d6d6d6] rounded-2xl p-3"
                            >
                                <Flex gap={12} align="center" className="min-w-0">
                                    <div className="flex items-center justify-center w-[58px] h-[58px] rounded-[10px] bg-[#f8f8f8] flex-shrink-0">
                                        <Text className="!text-[20px] !font-medium !text-lightRed">
                                            {initials(director.name)}
                                        </Text>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <Text className="!text-[14px] !text-[#94a3b8] !leading-6">Director</Text>
                                        <Text className="!text-[16px] !font-medium !text-[#1e293b] !leading-6 truncate">
                                            {director.name}
                                        </Text>
                                    </div>
                                </Flex>
                                <div className="flex flex-col items-end flex-shrink-0">
                                    <Text className="!text-[14px] !text-[#94a3b8] !leading-6">DIN</Text>
                                    <Text className="!text-[16px] !font-medium !text-[#1e293b] !leading-6">
                                        {director.din || '—'}
                                    </Text>
                                </div>
                            </Flex>
                        ))}
                    </div>
                </div>
            )}

            {/* Official Documents */}
            {documents.length > 0 && (
                <div className="flex flex-col gap-4 w-full">
                    <Flex align="center" justify="space-between" gap={12} wrap="wrap">
                        <Text className="!text-[18px] sm:!text-[20px] !font-semibold !text-[#64748b] !leading-7">
                            Official Documents
                        </Text>
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={() => documents.forEach(doc => downloadFile(doc.fieldId, doc.fileName, doc.url))}
                            className="!border-[#ff4d4f] !text-[#ff4d4f] hover:!bg-bgRedLight !rounded-lg !text-[14px]"
                        >
                            Download All
                        </Button>
                    </Flex>
                    <div className="bg-white border border-[#d3d3d3] rounded-[24px] p-4 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                            {documents.map((doc, idx) => (
                                <Flex
                                    key={`${doc.title}-${idx}`}
                                    align="center"
                                    justify="space-between"
                                    gap={8}
                                    className="border border-[#d6d6d6] rounded-2xl p-4 min-w-0"
                                >
                                    <Flex gap={12} align="center" className="min-w-0">
                                        <FilePdfFilled className="!text-[#ff4d4f] text-[24px] flex-shrink-0" />
                                        <div className="flex flex-col min-w-0">
                                            <Text className="!text-[16px] !font-medium !text-[#1e293b] !leading-6 truncate">
                                                {doc.title}
                                            </Text>
                                            {doc.meta && (
                                                <Text className="!text-[14px] !text-[#94a3b8] !leading-6 truncate">
                                                    {doc.meta}
                                                </Text>
                                            )}
                                        </div>
                                    </Flex>
                                    <Flex
                                        gap={10}
                                        align="center"
                                        className="border border-[rgba(255,79,79,0.3)] rounded-lg px-3 py-2 flex-shrink-0"
                                    >
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" aria-label="View document">
                                            <EyeOutlined className="!text-[#ff4d4f] text-[16px]" />
                                        </a>
                                        <div className="w-px h-4 bg-[rgba(255,79,79,0.3)]" />
                                        <button
                                            type="button"
                                            onClick={() => downloadFile(doc.fieldId, doc.fileName, doc.url)}
                                            aria-label="Download document"
                                            className="bg-transparent border-0 p-0 m-0 leading-none cursor-pointer"
                                        >
                                            <DownloadOutlined className="!text-[#ff4d4f] text-[16px]" />
                                        </button>
                                    </Flex>
                                </Flex>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyDetailsCard;
