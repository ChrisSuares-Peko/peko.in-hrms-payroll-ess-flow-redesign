import { useEffect, useState } from 'react';

import { CheckCircleOutlined, ClockCircleOutlined, FormOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Spin, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import TypographyText from '@components/atomic/typography/typographyText';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { fetchLegalDocumentById, downloadDocument, resendSignatoryApi } from '../api';
import DocumentTextIcon from '../assets/icons/document-text.svg';
import DownloadIcon from '../assets/icons/download.svg';
import EditIcon from '../assets/icons/edit.svg';
import RefreshIcon from '../assets/icons/refresh.svg';
import Send2AltIcon from '../assets/icons/send-2-alt.svg';
import SendEsignIcon from '../assets/icons/send-esign-white.svg';
import TickGreyIcon from '../assets/icons/tick-grey.svg';
import SignatoryCard from '../components/documentDetail/SignatoryCard';
import TimelineItem from '../components/documentDetail/TimelineItem';
import DocumentDetailSkeleton from '../components/shared/DocumentDetailSkeleton';
import PDFAllPages from '../components/shared/PDFAllPages';
import type { LegalDocument, LegalDocStatus } from '../types';

const STATUS_BADGE: Record<
    LegalDocStatus,
    { bg: string; outline: string; text: string; icon: React.ReactNode }
> = {
    Signed: {
        bg: 'bg-emerald-50',
        outline: 'outline-emerald-500',
        text: '!text-emerald-700',
        icon: <CheckCircleOutlined className="text-emerald-700 text-sm" />,
    },
    Sent: {
        bg: 'bg-blue-50',
        outline: 'outline-blue-400',
        text: '!text-blue-600',
        icon: <ClockCircleOutlined className="text-blue-600 text-sm" />,
    },
    Draft: {
        bg: 'bg-gray-100',
        outline: 'outline-gray-400',
        text: '!text-gray-500',
        icon: <FormOutlined className="text-gray-500 text-sm" />,
    },
};

const toUiStatus = (s: string): LegalDocStatus => {
    if (s === 'SIGNED') return 'Signed';
    if (s === 'SENT') return 'Sent';
    return 'Draft';
};

const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const MetaRow = ({ label, value }: { label: string; value: string }) => (
    <Flex justify="space-between" align="center">
        <Typography.Text className="!text-neutral-400 !text-base">{label}</Typography.Text>
        <Typography.Text className="!text-zinc-950 !text-base">{value}</Typography.Text>
    </Flex>
);

const DocumentDetailPage = () => {
    const navigate = useNavigate();
    const { documentId } = useParams<{ documentId: string }>();
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [doc, setDoc] = useState<LegalDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isResending, setIsResending] = useState<string | null>(null);

    useEffect(() => {
        if (!documentId) return;
        const load = async () => {
            setIsLoading(true);
            const data = await fetchLegalDocumentById({ userId, userType: role, documentId });
            if (data) setDoc(data);
            setIsLoading(false);
        };
        load();
    }, [documentId, userId, role]);

    useEffect(() => {
        if (!doc || !documentId) return;
        const load = async () => {
            setIsRendering(true);
            const result = await downloadDocument({ userId, userType: role, documentId });
            if (result && 'blob' in result) setPdfUrl(URL.createObjectURL(result.blob));
            else if (result && 'error' in result)
                dispatch(showToast({ description: result.error, variant: 'error' }));
            setIsRendering(false);
        };
        load();
    }, [doc, documentId, userId, role, dispatch]);

    const handleDownload = async () => {
        if (!doc || !documentId) return;
        setIsDownloading(true);
        const result = await downloadDocument({ userId, userType: role, documentId });
        if (result && 'blob' in result) {
            const url = window.URL.createObjectURL(result.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${doc.title}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            dispatch(
                showToast({
                    description:
                        result && 'error' in result ? result.error : 'Document PDF not available',
                    variant: 'error',
                })
            );
        }
        setIsDownloading(false);
    };

    const handleResend = async (email: string, name: string) => {
        if (!doc?.eSign?.id) return;
        setIsResending('resending');
        try {
            const resp = await resendSignatoryApi({
                userId,
                userType: role,
                eSignId: doc.eSign.id,
                email,
                name,
            });
            if (resp && (resp as any).status) {
                dispatch(
                    showToast({
                        description: (resp as any).message || 'Invitation resent  successfully',
                        variant: 'success',
                    })
                );
            } else if (resp && !(resp as any).status) {
                dispatch(
                    showToast({
                        description: (resp as any).message || 'Failed to resend invitation',
                        variant: 'error',
                    })
                );
            }
        } finally {
            setIsResending(null);
        }
    };

    const handleEdit = () => {
        if (!doc) return;
        navigate(`/more-services/legal-service/document/${doc.id}`, {
            state: { documentId: doc.id, editorHtml: doc.editorHtml ?? '', title: doc.title },
        });
    };

    if (isLoading) return <DocumentDetailSkeleton />;

    if (!doc) {
        return (
            <Flex justify="center" align="center" className="min-h-screen">
                <TypographyText className="text-gray-500 text-base font-['Roboto']">
                    Document not found.
                </TypographyText>
            </Flex>
        );
    }

    const status = toUiStatus(doc.status);
    const badge = STATUS_BADGE[status];

    const timelineEvents = [
        {
            title: 'Created',
            description: 'Document generated from template',
            date: formatDate(doc.createdAt),
            active: true,
            icon: DocumentTextIcon,
            isSignedStep: false,
        },
        {
            title: 'Sent for Signature',
            description: 'Sent to all signatories via email',
            date: status === 'Sent' || status === 'Signed' ? formatDate(doc.updatedAt) : '',
            active: status === 'Sent' || status === 'Signed',
            icon: Send2AltIcon,
            isSignedStep: false,
        },
        {
            title: 'Signed',
            description: 'All signatures collected',
            date: status === 'Signed' ? formatDate(doc.updatedAt) : '',
            active: status === 'Signed',
            icon: TickGreyIcon,
            isSignedStep: true,
        },
    ];

    const category =
        (doc as any).legalTemplate?.category || (doc as any).userPersonalTemplate?.category || null;

    const metaRows = [
        { label: 'Document ID', value: String(doc.id) },
        { label: 'Title', value: doc.title },
        ...(category ? [{ label: 'Category', value: category }] : []),
        { label: 'Created', value: formatDate(doc.createdAt) },
        { label: 'Last updated', value: formatDate(doc.updatedAt) },
    ];

    return (
        <Flex vertical gap={36} className="pt-4 pb-10">
            {/* Header */}
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Flex align="center" gap={12} wrap="wrap">
                    <TypographyText className="text-gray-900 text-2xl font-semibold font-['Roboto'] leading-8 block">
                        {doc.title}
                    </TypographyText>
                    <Flex
                        align="center"
                        gap={6}
                        className={`px-3 py-1 ${badge.bg} rounded-full outline outline-[0.5px] ${badge.outline}`}
                    >
                        <Typography.Text className={`${badge.text} !text-sm !font-medium`}>
                            {status}
                        </Typography.Text>
                        {badge.icon}
                    </Flex>
                </Flex>

                <Flex align="center" gap={12} wrap="wrap">
                    {doc.status === 'DRAFT' && (
                        <Button
                            onClick={handleEdit}
                            icon={
                                <ReactSVG
                                    src={EditIcon}
                                    beforeInjection={svg => {
                                        svg.setAttribute('style', 'width:16px;height:16px;');
                                        svg.setAttribute('stroke', '#EF4444');
                                    }}
                                />
                            }
                            className="!h-10 !border-red-500 !text-red-500 hover:!border-red-400 hover:!text-red-400 !rounded-lg !font-normal"
                        >
                            Edit
                        </Button>
                    )}
                    <Button
                        loading={isDownloading}
                        onClick={handleDownload}
                        icon={
                            !isDownloading && (
                                <ReactSVG
                                    src={DownloadIcon}
                                    beforeInjection={svg => {
                                        svg.setAttribute('style', 'width:16px;height:16px;');
                                        svg.setAttribute('stroke', '#EF4444');
                                    }}
                                />
                            )
                        }
                        className="!h-10 !border-red-500 !text-red-500 hover:!border-red-400 hover:!text-red-400 !rounded-lg !font-normal"
                    >
                        Download
                    </Button>
                    {doc.status === 'DRAFT' && (
                        <Button
                            icon={
                                <ReactSVG
                                    src={SendEsignIcon}
                                    beforeInjection={svg => {
                                        svg.setAttribute('style', 'width:16px;height:16px;');
                                        svg.setAttribute('stroke', 'white');
                                    }}
                                />
                            }
                            className="!h-10 !bg-[#FF3A3A] !border-[#FF3A3A] !text-white hover:!bg-[#e02020] !rounded-lg !font-normal"
                            onClick={() =>
                                navigate(
                                    `/more-services/legal-service/document/${documentId}/send-for-esign`
                                )
                            }
                        >
                            e-Sign
                        </Button>
                    )}
                </Flex>
            </Flex>

            {/* Body */}
            <Flex className="flex-col xl:flex-row items-stretch">
                {/* Left: PDF */}
                <Flex className="flex-1 min-w-0 p-8 bg-gray-50 rounded-tl-[28px] rounded-bl-[28px] xl:rounded-tr-none xl:rounded-br-none">
                    {isRendering && (
                        <Flex
                            justify="center"
                            align="center"
                            className="w-full"
                            style={{ minHeight: 600 }}
                        >
                            <Spin size="large" />
                        </Flex>
                    )}
                    {!isRendering && pdfUrl && (
                        <PDFAllPages
                            fileUrl={pdfUrl}
                            onPageCountChange={() => {}}
                            onPageChange={() => {}}
                        />
                    )}
                    {!isRendering && !pdfUrl && (
                        <Flex
                            justify="center"
                            align="center"
                            className="w-full"
                            style={{ minHeight: 600 }}
                        >
                            <TypographyText className="text-gray-400 text-sm font-['Roboto']">
                                Unable to render document
                            </TypographyText>
                        </Flex>
                    )}
                </Flex>

                {/* Right: sidebar */}
                <Flex
                    vertical
                    gap={24}
                    className="w-full xl:w-[420px] shrink-0 p-4 pt-6 bg-white rounded-tr-[28px] rounded-br-[28px] shadow-[0px_2px_20px_0px_rgba(0,0,0,0.06)]"
                >
                    {/* Timeline */}
                    <Flex
                        vertical
                        gap={32}
                        className="p-4 py-6 rounded-[20px] outline outline-[0.38px] outline-stone-300"
                    >
                        <Flex vertical>
                            <Typography.Text className="!text-gray-600 !text-lg !font-medium px-3">
                                Document Timeline
                            </Typography.Text>
                            <Divider className="!mt-4 !mb-0" />
                        </Flex>
                        <Flex vertical gap={0}>
                            {timelineEvents.map((event, i) => (
                                <TimelineItem
                                    key={event.title}
                                    iconSrc={event.icon}
                                    title={event.title}
                                    description={event.description}
                                    date={event.date}
                                    active={event.active}
                                    isLast={i === timelineEvents.length - 1}
                                    isSignedStep={event.isSignedStep}
                                />
                            ))}
                        </Flex>
                    </Flex>

                    {/* Signatories */}
                    {doc.eSign?.signers_info?.length ? (
                        <>
                            <Flex
                                vertical
                                gap={32}
                                className="p-4 py-6 rounded-[20px] outline outline-[0.38px] outline-stone-300"
                            >
                                <Flex vertical>
                                    <Typography.Text className="!text-gray-600 !text-lg !font-medium px-3">
                                        Signatories
                                    </Typography.Text>
                                    <Divider className="!mt-4 !mb-0" />
                                </Flex>
                                <Flex vertical gap={12}>
                                    {doc.eSign.signers_info.map(signer => {
                                        const initials = signer.signer_name
                                            .split(' ')
                                            .map((w: string) => w[0])
                                            .join('')
                                            .toUpperCase()
                                            .slice(0, 2);
                                        return (
                                            <SignatoryCard
                                                key={signer.signer_id}
                                                initials={initials}
                                                name={signer.signer_name}
                                                email={signer.signer_email}
                                                date={formatDate(doc.eSign?.expiry_date)}
                                                status={
                                                    signer.status === 'signed'
                                                        ? 'Signed'
                                                        : 'Pending'
                                                }
                                            />
                                        );
                                    })}
                                </Flex>
                            </Flex>

                            {/* Resend button */}
                            {status !== 'Signed' && (
                                <Flex>
                                    <Button
                                        size="large"
                                        loading={isResending !== null}
                                        icon={
                                            isResending === null && (
                                                <ReactSVG
                                                    src={RefreshIcon}
                                                    beforeInjection={svg => {
                                                        svg.setAttribute(
                                                            'style',
                                                            'width:16px;height:16px;'
                                                        );
                                                        svg.setAttribute('stroke', '#EF4444');
                                                    }}
                                                />
                                            )
                                        }
                                        className="w-full !h-12 !border-red-500 !text-red-500 hover:!border-red-400 hover:!text-red-400 !rounded-lg !font-medium !text-base"
                                        onClick={() => {
                                            const pending = doc.eSign?.signers_info.find(
                                                s => s.status !== 'signed'
                                            );
                                            if (pending)
                                                handleResend(
                                                    pending.signer_email,
                                                    pending.signer_name
                                                );
                                        }}
                                    >
                                        Resend signatory
                                    </Button>
                                </Flex>
                            )}
                        </>
                    ) : null}

                    {/* Metadata */}
                    <Flex
                        vertical
                        gap={24}
                        className="p-6 bg-gray-50 rounded-2xl outline outline-1 outline-black/5"
                    >
                        {metaRows.map(row => (
                            <MetaRow key={row.label} label={row.label} value={row.value} />
                        ))}
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default DocumentDetailPage;
