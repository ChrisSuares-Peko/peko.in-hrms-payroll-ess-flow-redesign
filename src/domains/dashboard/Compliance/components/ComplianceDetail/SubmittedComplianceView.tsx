import { useState } from 'react';

import { Button, Flex, Form, Skeleton, Typography } from 'antd';
import { Formik } from 'formik';

import { useAppSelector } from '@src/hooks/store';

import DocUploadField, { DocFieldValue } from './DocUploadField';
import StepIndicator from './StepIndicator';
import StepInfo from './StepInfo';
import { downloadComplianceDocumentApi, SubmitDocumentItem } from '../../api';
import iconInfoCircle from '../../assets/icons/icon-info-circle.svg';
import iconReceiptEdit from '../../assets/icons/icon-receipt-edit.svg';
import { ComplianceDetailApiResponse } from '../../types';
import type { FieldDef } from '../../types/formConfig';
import { complianceFormConfig } from '../../utils/complianceFormConfig';
import { COMPLIANCE_STATUS_CONFIG, ComplianceHealthItem, formatComplianceDate } from '../../utils/data';

const { Text } = Typography;

const API_STATUS_MAP: Record<string, string> = {
    pending: 'overdue',
    compliant: 'completed',
    non_compliant: 'overdue',
    in_review: 'processing',
};

interface Props {
    detail: ComplianceDetailApiResponse | null;
    isLoading: boolean;
    complianceType: string;
    item: ComplianceHealthItem;
    canReupload?: boolean;
    onReupload?: (documents: SubmitDocumentItem[]) => void;
    isSubmitting?: boolean;
    onInfoContinue?: (values: Record<string, unknown>) => void;
    savedValues?: Record<string, unknown>;
}

function groupBySection(fields: FieldDef[]): { section: string; fields: FieldDef[] }[] {
    const { order, map } = fields.reduce<{ order: string[]; map: Record<string, FieldDef[]> }>(
        (acc, field) => {
            const key = field.section ?? '';
            if (!acc.map[key]) { acc.map[key] = []; acc.order.push(key); }
            acc.map[key].push(field);
            return acc;
        },
        { order: [], map: {} }
    );
    return order.map(s => ({ section: s, fields: map[s] }));
}

function formatValue(field: FieldDef, raw: unknown): string {
    if (raw === undefined || raw === null || raw === '') return '—';
    if (field.type === 'checkbox' || typeof raw === 'boolean') return raw ? 'Yes' : 'No';
    if (field.type === 'select' && field.options) {
        const opt = field.options.find(o => o.value === raw);
        return opt ? opt.label : String(raw);
    }
    if (field.type === 'multiselect' && Array.isArray(raw)) {
        return raw.map(v => field.options?.find(o => o.value === v)?.label ?? String(v)).join(', ') || '—';
    }
    if (field.type === 'date' && typeof raw === 'string' && raw) {
        const d = new Date(raw);
        if (!Number.isNaN(d.getTime())) return formatComplianceDate(d);
    }
    return String(raw);
}

function getCellValue(val: unknown): string {
    return val ? 'Yes' : 'No';
}

function FieldCell({ field, value }: { field: FieldDef; value: unknown }) {
    if (field.type === 'note' || !field.label) return null;

    if (field.type === 'repeatable-table' && Array.isArray(value) && field.columns) {
        const cols = field.columns.filter(c => c.type !== 'serial');
        return (
            <div className={field.colSpan === 1 ? 'col-span-1' : 'col-span-2'}>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)] !block !mb-1">{field.label}</Text>
                {value.length === 0 ? (
                    <Text className="!text-[13px] !text-[#292d32]">—</Text>
                ) : (
                    <div className="overflow-x-auto mt-1">
                        <table className="w-full text-[12px] border-collapse">
                            <thead>
                                <tr>
                                    {cols.map(c => (
                                        <th key={c.key} className="text-left border border-[#ebebeb] px-2 py-1 text-[rgba(0,0,0,0.45)] font-medium bg-[#fafafa]">
                                            {c.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(value as Record<string, unknown>[]).map((row, i) => (
                                    <tr key={i}>
                                        {cols.map(c => (
                                            <td key={c.key} className="border border-[#ebebeb] px-2 py-1 text-[#292d32]">
                                                {c.type === 'checkbox' ? getCellValue(row[c.key]) : String(row[c.key] ?? '—')}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={field.colSpan === 1 ? 'col-span-1' : 'col-span-2'}>
            <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)] !block !mb-1">{field.label}</Text>
            <Text className="!text-[13px] !font-medium !text-[#292d32] break-words">{formatValue(field, value)}</Text>
        </div>
    );
}

export default function SubmittedComplianceView({ detail, isLoading, complianceType, item, canReupload, onReupload, isSubmitting, onInfoContinue, savedValues }: Props) {
    const [activeStep, setActiveStep] = useState(0);
    const [downloadingId, setDownloadingId] = useState<number | string | null>(null);
    const { id: userId, role: userType } = useAppSelector((state) => (state.reducer as any).auth);

    const handleDocDownload = async (doc: { id: number | string; url: string; name: string }) => {
        setDownloadingId(doc.id);
        await downloadComplianceDocumentApi({ userId, userType, url: doc.url, name: doc.name });
        setDownloadingId(null);
    };

    if (isLoading) {
        return (
            <Flex vertical gap={24} className="w-full">
                <Skeleton active paragraph={{ rows: 1 }} title={false} />
                <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
                    <Skeleton active paragraph={{ rows: 5 }} />
                </div>
            </Flex>
        );
    }

    if (!detail) return null;

    const statusKey = API_STATUS_MAP[detail.status] ?? 'upcoming';
    const statusConfig = COMPLIANCE_STATUS_CONFIG[statusKey];

    const config = complianceFormConfig[complianceType];
    const fields = (config?.fields ?? []).filter(f => f.type !== 'note' && f.label);
    const groups = groupBySection(fields);
    const hasSections = groups.some(g => g.section !== '');
    const formData = detail.formData ?? {};

    return (
        <Flex vertical gap={24} className="w-full">
            <StepIndicator currentStep={activeStep} onStepClick={setActiveStep} />

            {/* Step 0 — Overview */}
            {activeStep === 0 && (
                <Flex vertical gap={16} className="w-full">
                    <Flex vertical gap={16} className="bg-[#f8fafc] rounded-[24px] p-7">
                        <Text className="!text-[20px] !font-semibold !leading-[28px] !text-[#101828] block">
                            What is this compliance?
                        </Text>
                        <Text className="!text-[16px] !font-normal !leading-[24px] !text-[#475569] block">
                            {item.whatIsThis ?? item.description}
                        </Text>
                    </Flex>

                    <Flex vertical gap={16} className="bg-[#f8fafc] rounded-[24px] p-7">
                        <Text className="!text-[20px] !font-semibold !leading-[28px] !text-[#101828] block">
                            Why is it required?
                        </Text>
                        <Text className="!text-[16px] !font-normal !leading-[24px] !text-[#475569] block">
                            {item.whyRequired ?? 'Mandatory compliance under applicable Indian law. Ensure timely filing to avoid penalties.'}
                        </Text>
                    </Flex>

                    {item.penalty && (
                        <Flex vertical gap={16} className="bg-[#fcf3f3] rounded-[24px] p-7">
                            <Flex align="center" gap={8}>
                                <img src={iconInfoCircle} alt="" width={24} height={24} className="shrink-0" />
                                <Text className="!text-[20px] !font-semibold !leading-[28px] !text-[#101828]">
                                    Penalty if missed
                                </Text>
                            </Flex>
                            <Text className="!text-[16px] !font-normal !leading-[24px] !text-[#1e293b] block">
                                {item.penalty}
                            </Text>
                        </Flex>
                    )}

                    {/* Status summary */}
                    <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
                        <Flex align="center" gap={8} className="mb-4">
                            <span
                                className="text-[11px] font-semibold px-3 py-1 rounded-full"
                                style={{ color: statusConfig?.color, background: statusConfig?.bg }}
                            >
                                {statusConfig?.label ?? detail.status}
                            </span>
                            <Text className="!text-[12px] !text-[rgba(0,0,0,0.45)] capitalize">{detail.category}</Text>
                        </Flex>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <div>
                                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)] !block !mb-1">Due Date</Text>
                                <Text className="!text-[13px] !font-medium !text-[#292d32]">
                                    {detail.dueDate ? formatComplianceDate(detail.dueDate) : '—'}
                                </Text>
                            </div>
                            <div>
                                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)] !block !mb-1">Submitted On</Text>
                                <Text className="!text-[13px] !font-medium !text-[#292d32]">
                                    {detail.createdAt ? formatComplianceDate(detail.createdAt) : '—'}
                                </Text>
                            </div>
                            {detail.notes ? (
                                <div className="col-span-2">
                                    <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)] !block !mb-1">Notes</Text>
                                    <Text className="!text-[13px] !text-[#292d32]">{detail.notes}</Text>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <Flex justify="flex-end" className="mt-4">
                        <Button
                            type="primary"
                            onClick={() => setActiveStep(1)}
                            className="!h-10 !w-[154px] !rounded-lg !bg-[#ff4f4f] !border-[#ff4f4f] !font-medium !text-[15px]"
                        >
                            Next
                        </Button>
                    </Flex>
                </Flex>
            )}

            {/* Step 1 — Information required */}
            {activeStep === 1 && (
                canReupload && onInfoContinue ? (
                    <StepInfo
                        complianceType={complianceType}
                        savedValues={savedValues as Record<string, string | string[] | boolean | Record<string, string | boolean>[]> | undefined}
                        rejectedFields={detail?.rejectedFormFields}
                        onBack={() => setActiveStep(0)}
                        onContinue={(values) => {
                            onInfoContinue(values as Record<string, unknown>);
                            setActiveStep(2);
                        }}
                    />
                ) : (
                    <Flex vertical gap={16} className="w-full">
                        {fields.length === 0 && (
                            <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
                                <Text className="!text-[13px] !text-[rgba(0,0,0,0.45)]">No information available.</Text>
                            </div>
                        )}
                        {fields.length > 0 && hasSections && groups.map(group => (
                            <div key={group.section} className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
                                <Flex align="flex-start" gap={14} className="mb-5">
                                    <div className="bg-[#fff4f4] rounded-[10px] p-[7px] shrink-0">
                                        <img src={iconReceiptEdit} alt="" width={24} height={24} />
                                    </div>
                                    <Text className="!text-[14px] !font-medium !text-black">{group.section}</Text>
                                </Flex>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                    {group.fields.map(f => (
                                        <FieldCell key={f.key} field={f} value={formData[f.key]} />
                                    ))}
                                </div>
                            </div>
                        ))}
                        {fields.length > 0 && !hasSections && (
                            <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
                                <Flex align="flex-start" gap={14} className="mb-5">
                                    <div className="bg-[#fff4f4] rounded-[10px] p-[7px] shrink-0">
                                        <img src={iconReceiptEdit} alt="" width={24} height={24} />
                                    </div>
                                    <Text className="!text-[14px] !font-medium !text-black">Information Provided</Text>
                                </Flex>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                    {fields.map(f => (
                                        <FieldCell key={f.key} field={f} value={formData[f.key]} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <Flex justify="flex-end" gap={10} className="mt-4">
                            <Button
                                onClick={() => setActiveStep(0)}
                                className="!h-10 !w-[118px] !rounded-lg !border-[#ff4f4f] !text-[#ff4f4f] !font-medium !text-[15px]"
                            >
                                Back
                            </Button>
                            <Button
                                type="primary"
                                onClick={() => setActiveStep(2)}
                                className="!h-10 !w-[154px] !rounded-lg !bg-[#ff4f4f] !border-[#ff4f4f] !font-medium !text-[15px]"
                            >
                                Next
                            </Button>
                        </Flex>
                    </Flex>
                )
            )}

            {/* Step 2 — Documents */}
            {activeStep === 2 && (() => {
                const docs = complianceFormConfig[complianceType]?.docs ?? [];
                if (canReupload && onReupload) {
                    const rejectedKeys = detail.rejectedDocumentKeys ?? [];
                    const uploadDocs = docs.filter(d => rejectedKeys.includes(d.key));
                    const acceptedDocs = detail.documents.filter(d => !rejectedKeys.includes(d.key ?? ''));
                    const filteredInitial: Record<string, DocFieldValue | ''> = Object.fromEntries(uploadDocs.map(d => [d.key, '']));

                    return (
                        <Formik
                            initialValues={filteredInitial}
                            onSubmit={(values) => {
                                const documents: SubmitDocumentItem[] = uploadDocs
                                    .filter(d => values[d.key] && (values[d.key] as DocFieldValue).base64)
                                    .map(d => ({ key: d.key, ...(values[d.key] as DocFieldValue) }));
                                onReupload(documents);
                            }}
                        >
                            {({ handleSubmit }) => (
                                <Form layout="vertical" onFinish={handleSubmit} className="w-full">
                                    {detail.adminRemarks && (
                                        <div className="mb-4 bg-[#fff8f0] border border-[#ffd591] rounded-[12px] px-4 py-3">
                                            <Text className="!text-[12px] !text-[#d46b08] !font-medium !block !mb-0.5">Admin remarks</Text>
                                            <Text className="!text-[13px] !text-[#7c4700]">{detail.adminRemarks}</Text>
                                        </div>
                                    )}
                                    {acceptedDocs.length > 0 && (
                                        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full mb-4">
                                            <Flex align="flex-start" gap={14} className="mb-5">
                                                <div className="bg-[#fff4f4] rounded-[10px] p-[7px] shrink-0">
                                                    <img src={iconReceiptEdit} alt="" width={24} height={24} />
                                                </div>
                                                <Flex vertical gap={4}>
                                                    <Text className="!text-[14px] !font-medium !text-black">Previously uploaded documents</Text>
                                                    <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">These documents were accepted and do not need to be re-uploaded</Text>
                                                </Flex>
                                            </Flex>
                                            <Flex vertical gap={12} className="w-full">
                                                {acceptedDocs.map(doc => (
                                                    <Flex
                                                        key={doc.id}
                                                        align="center"
                                                        justify="space-between"
                                                        className="border-[0.927px] border-dashed border-[#cbd0dc] rounded-[11px] px-4 h-[51px]"
                                                        style={{ opacity: 0.7 }}
                                                    >
                                                        <Flex align="center" gap={10} className="flex-1 min-w-0">
                                                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
                                                                <rect width="28" height="28" rx="4" fill="#f0fff4" />
                                                                <text x="4" y="20" fontSize="9" fontWeight="700" fill="#52c41a">PDF</text>
                                                            </svg>
                                                            <Flex vertical gap={0} className="flex-1 min-w-0">
                                                                <Text className="!text-[14px] !font-medium !text-[#292d32] truncate !block">{doc.name}</Text>
                                                                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">{formatComplianceDate(doc.uploadedAt)}</Text>
                                                            </Flex>
                                                        </Flex>
                                                        <span className="text-[11px] text-[#52c41a] font-medium ml-3 shrink-0">Accepted</span>
                                                    </Flex>
                                                ))}
                                            </Flex>
                                        </div>
                                    )}
                                    {uploadDocs.length > 0 && (
                                        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
                                            <Flex align="flex-start" gap={14} className="mb-5">
                                                <div className="bg-[#fff4f4] rounded-[10px] p-[7px] shrink-0">
                                                    <img src={iconReceiptEdit} alt="" width={24} height={24} />
                                                </div>
                                                <Flex vertical gap={4}>
                                                    <Text className="!text-[14px] !font-medium !text-black">Re-upload required documents</Text>
                                                    <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                                                        Accepted formats: PDF, JPG, PNG. Max size: 5MB per file
                                                    </Text>
                                                </Flex>
                                            </Flex>
                                            <Flex vertical gap={20} className="w-full">
                                                {uploadDocs.map(doc => (
                                                    <DocUploadField key={doc.key} name={doc.key} label={doc.label} />
                                                ))}
                                            </Flex>
                                        </div>
                                    )}
                                    <Flex justify="flex-end" gap={10} className="mt-4">
                                        <Button
                                            onClick={() => setActiveStep(1)}
                                            className="!h-10 !w-[118px] !rounded-lg !border-[#ff4f4f] !text-[#ff4f4f] !font-medium !text-[15px]"
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={isSubmitting}
                                            className="!h-10 !w-[154px] !rounded-lg !bg-[#ff4f4f] !border-[#ff4f4f] !font-medium !text-[15px]"
                                        >
                                            Submit 
                                        </Button>
                                    </Flex>
                                </Form>
                            )}
                        </Formik>
                    );
                }

                return (
                    <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
                        <Flex align="flex-start" gap={14} className="mb-5">
                            <div className="bg-[#fff4f4] rounded-[10px] p-[7px] shrink-0">
                                <img src={iconReceiptEdit} alt="" width={24} height={24} />
                            </div>
                            <Flex vertical gap={4}>
                                <Text className="!text-[14px] !font-medium !text-black">Uploaded Documents</Text>
                                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                                    {detail.documents.length} document{detail.documents.length !== 1 ? 's' : ''} submitted
                                </Text>
                            </Flex>
                        </Flex>
                        {detail.documents.length === 0 ? (
                            <Text className="!text-[13px] !text-[rgba(0,0,0,0.45)]">No documents uploaded.</Text>
                        ) : (
                            <Flex vertical gap={12} className="w-full">
                                {detail.documents.map(doc => (
                                    <Flex
                                        key={doc.id}
                                        align="center"
                                        justify="space-between"
                                        className="border-[0.927px] border-dashed border-[#cbd0dc] rounded-[11px] px-4 h-[51px] hover:border-[#ff4f4f] transition-colors cursor-pointer"
                                        onClick={() => handleDocDownload(doc)}
                                        style={{ opacity: downloadingId === doc.id ? 0.5 : 1, pointerEvents: downloadingId !== null ? 'none' : 'auto' }}
                                    >
                                        <Flex align="center" gap={10} className="flex-1 min-w-0">
                                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
                                                <rect width="28" height="28" rx="4" fill="#fff1f1" />
                                                <text x="4" y="20" fontSize="9" fontWeight="700" fill="#ff4f4f">PDF</text>
                                            </svg>
                                            <Flex vertical gap={0} className="flex-1 min-w-0">
                                                <Text className="!text-[14px] !font-medium !text-[#292d32] truncate !block">{doc.name}</Text>
                                                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">{formatComplianceDate(doc.uploadedAt)}</Text>
                                            </Flex>
                                        </Flex>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4f4f" strokeWidth="2" className="shrink-0 ml-3">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </Flex>
                                ))}
                            </Flex>
                        )}
                        <Flex justify="flex-end" className="mt-4">
                            <Button
                                onClick={() => setActiveStep(1)}
                                className="!h-10 !w-[118px] !rounded-lg !border-[#ff4f4f] !text-[#ff4f4f] !font-medium !text-[15px]"
                            >
                                Back
                            </Button>
                        </Flex>
                    </div>
                );
            })()}
        </Flex>
    );
}
