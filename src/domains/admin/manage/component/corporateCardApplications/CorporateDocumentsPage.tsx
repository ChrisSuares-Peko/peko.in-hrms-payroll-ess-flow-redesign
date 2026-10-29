import { useCallback, useEffect, useState } from 'react';

import {
    DownloadOutlined,
    EyeOutlined,
    FileTextOutlined,
    FileSearchOutlined,
} from '@ant-design/icons';
import { Button, Flex, Spin, Tag, Typography } from 'antd';
import { useLocation, useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import AgreementReviewPanel from './AgreementReviewPanel';
import KybProgressPanel from './KybProgressPanel';
import {
    downloadAllCorporateDocumentsForAdmin,
    getCorporateAgreementForAdmin,
    getCorporateDocumentFileForAdmin,
    getCorporateDocumentsForAdmin,
    regenerateCorporateAgreement,
} from '../../api/corporateDocuments';
import {
    CorporateAgreementReview,
    CorporateDocumentRow,
    CorporateDocumentsMap,
    KybProgressStep,
} from '../../types/corporateDocuments';

const MIME_TYPES: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const fileNameFromKey = (key: string) => key.split('/').pop() || key;

// Filesystem-unsafe characters only — keep spaces so "abc@yopmail.com_Corporate Agreement" reads naturally.
const sanitizeForFileName = (value: string) => value.replace(/[/\\:*?"<>|]/g, '-');

const CorporateDocumentsPage = () => {
    const { corporateId } = useParams<{ corporateId: string }>();
    const location = useLocation();
    const navState = location.state as {
        companyName?: string | null;
        email?: string | null;
        fullName?: string | null;
        pekoAccountNumber?: string | null;
    } | null;
    const companyName = navState?.companyName;
    const primaryName = companyName || navState?.fullName || 'Unnamed corporate';
    const showFullNameSegment = Boolean(companyName) && Boolean(navState?.fullName);
    // Prefer the corporate's login email (what the user asked for); fall back to company name/id so a
    // download filename is always produced even if email wasn't passed through.
    const identifier = navState?.email || companyName || `corporate-${corporateId}`;

    const dispatch = useAppDispatch();
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const [documents, setDocuments] = useState<CorporateDocumentsMap>({});
    const [expected, setExpected] = useState<CorporateDocumentRow[]>([]);
    const [progress, setProgress] = useState<KybProgressStep[]>([]);
    const [businessType, setBusinessType] = useState<string | null>(null);
    const [kybStatus, setKybStatus] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);
    const [agreement, setAgreement] = useState<CorporateAgreementReview | null>(null);
    const [agreementFailed, setAgreementFailed] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [openingAction, setOpeningAction] = useState<string | null>(null);
    const [downloadingAll, setDownloadingAll] = useState(false);

    const loadAgreement = useCallback(async () => {
        if (!corporateId) return;
        const resp = await getCorporateAgreementForAdmin(
            { userType: role, userId },
            Number(corporateId)
        );
        setAgreement(resp || null);
        setAgreementFailed(!resp);
    }, [corporateId, role, userId]);

    const loadDocuments = useCallback(async () => {
        if (!corporateId) return;
        setIsLoading(true);
        const resp = await getCorporateDocumentsForAdmin(
            { userType: role, userId },
            Number(corporateId)
        );
        setDocuments(resp ? resp.corporateDocuments : {});
        setExpected(resp ? resp.documents : []);
        // Left empty when the fetch failed, so the panel is absent rather than confidently
        // reporting an all-pending journey for a corporate who finished everything.
        setProgress(resp ? (resp.progress ?? []) : []);
        setBusinessType(resp ? resp.businessType : null);
        setKybStatus(resp ? resp.kybStatus : null);
        setRejectionReason(resp ? resp.rejectionReason : null);
        setIsLoading(false);
    }, [corporateId, role, userId]);

    const handleRegenerate = async () => {
        setRegenerating(true);
        const done = await regenerateCorporateAgreement(
            { userType: role, userId },
            Number(corporateId)
        );
        await Promise.all([loadAgreement(), loadDocuments()]);
        setRegenerating(false);
        dispatch(
            showToast(
                done
                    ? {
                          variant: 'success',
                          description:
                              'The agreement has been regenerated and queued for e-signature.',
                      }
                    : {
                          variant: 'error',
                          description: 'Could not regenerate the agreement. Please try again.',
                      }
            )
        );
    };

    useEffect(() => {
        loadDocuments();
        loadAgreement();
    }, [loadDocuments, loadAgreement]);

    const uploadedCount = Object.values(documents).filter(entry => entry?.document).length;

    const handleDownloadAll = async () => {
        setDownloadingAll(true);
        try {
            const archive = await downloadAllCorporateDocumentsForAdmin(
                { userType: role, userId },
                Number(corporateId)
            );
            if (!archive) {
                dispatch(
                    showToast({
                        variant: 'error',
                        description: 'Could not download the documents. Please try again.',
                    })
                );
                return;
            }
            const blobUrl = URL.createObjectURL(archive);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${sanitizeForFileName(identifier)}_KYB-Documents.zip`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        } finally {
            setDownloadingAll(false);
        }
    };

    const openDocument = async (
        docKey: string,
        mode: 'view' | 'download',
        documentLabel: string
    ) => {
        const actionKey = `${mode}-${docKey}`;
        setOpeningAction(actionKey);
        try {
            const data = await getCorporateDocumentFileForAdmin({ userType: role, userId }, docKey);
            if (!data || !data.buffer?.data) {
                window.open(docKey, '_blank', 'noopener,noreferrer');
                return;
            }
            const extension = data.type?.toLowerCase() || 'pdf';
            const mimeType = MIME_TYPES[extension] || 'application/octet-stream';
            const blob = new Blob([new Uint8Array(data.buffer.data)], { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);
            if (mode === 'view') {
                window.open(blobUrl, '_blank', 'noopener,noreferrer');
            } else {
                const downloadFileName = `${sanitizeForFileName(identifier)}_${sanitizeForFileName(documentLabel)}.${extension}`;
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = downloadFileName;
                link.click();
            }
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        } finally {
            setOpeningAction(null);
        }
    };

    return (
        <Flex vertical gap={20}>
            <Flex vertical gap={12}>
                <Flex align="center" gap={12} justify="space-between" wrap="wrap">
                    <Flex align="center" gap={12}>
                        <div className="flex size-10 items-center justify-center rounded-xl bg-bgIconCard">
                            <FileSearchOutlined className="text-xl text-brandColor" />
                        </div>
                        <Flex vertical gap={2}>
                            <Typography.Title level={4} className="!mb-0">
                                Uploaded Documents
                            </Typography.Title>
                            <Typography.Text className="text-sm text-textBody">
                                {primaryName}
                                {showFullNameSegment ? ` · ${navState?.fullName}` : ''}
                                {navState?.pekoAccountNumber
                                    ? ` · ${navState.pekoAccountNumber}`
                                    : ''}
                                {navState?.email ? ` · ${navState.email}` : ''}
                            </Typography.Text>
                        </Flex>
                    </Flex>
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        loading={downloadingAll}
                        disabled={isLoading || uploadedCount === 0}
                        onClick={handleDownloadAll}
                    >
                        Download All
                    </Button>
                </Flex>
            </Flex>

            {!isLoading && (
                <KybProgressPanel
                    steps={progress}
                    businessType={businessType}
                    kybStatus={kybStatus}
                    rejectionReason={rejectionReason}
                />
            )}

            {!isLoading && (
                <AgreementReviewPanel
                    review={agreement}
                    loadFailed={agreementFailed}
                    onRetry={loadAgreement}
                    onRegenerate={handleRegenerate}
                    onOpenGenerated={(docKey, mode) =>
                        openDocument(docKey, mode, 'Corporate Agreement (filled from the form)')
                    }
                    regenerating={regenerating}
                    isOpening={(docKey, mode) => openingAction === `${mode}-${docKey}`}
                />
            )}

            <div className="rounded-2xl border border-borderCard bg-white p-4 sm:p-6">
                {isLoading && (
                    <Flex justify="center" className="py-10">
                        <Spin />
                    </Flex>
                )}
                {!isLoading && (
                    <Flex vertical>
                        {expected.map(({ documentName, label, required }) => {
                            const entry = documents[documentName];
                            const docKey = entry?.document;
                            const uploaded = Boolean(docKey);
                            const fileName =
                                entry?.fileName || (docKey ? fileNameFromKey(docKey) : '');

                            let statusColor = 'default';
                            let statusLabel = 'Not uploaded';
                            if (uploaded) {
                                statusColor = 'blue';
                                statusLabel = 'Uploaded';
                            } else if (required) {
                                statusColor = 'red';
                                statusLabel = 'Missing';
                            }

                            return (
                                <Flex
                                    key={documentName}
                                    justify="space-between"
                                    align="center"
                                    className="-mx-3 rounded-xl border-b border-borderDivider px-3 py-3 transition-colors last:border-b-0 hover:bg-bgLightPink"
                                >
                                    <Flex gap={10} align="center">
                                        <FileTextOutlined className="text-lg text-textGreyLight" />
                                        <Flex vertical>
                                            <Flex gap={8} align="center">
                                                <Typography.Text className="font-medium">
                                                    {label}
                                                </Typography.Text>
                                                <Tag
                                                    className="rounded-full border-0 px-2 text-xs"
                                                    color={statusColor}
                                                >
                                                    {statusLabel}
                                                </Tag>
                                            </Flex>
                                            {uploaded && (
                                                <Typography.Text className="text-xs text-textGreyLight">
                                                    {fileName}
                                                </Typography.Text>
                                            )}
                                        </Flex>
                                    </Flex>
                                    {uploaded && docKey && (
                                        <Flex gap={12} align="center">
                                            {openingAction === `download-${docKey}` ||
                                            openingAction === `view-${docKey}` ? (
                                                <Spin size="small" />
                                            ) : (
                                                <>
                                                    <DownloadOutlined
                                                        className="cursor-pointer text-textGreyLight hover:text-brandColor"
                                                        onClick={() =>
                                                            openDocument(docKey, 'download', label)
                                                        }
                                                    />
                                                    <EyeOutlined
                                                        className="cursor-pointer text-textGreyLight hover:text-brandColor"
                                                        onClick={() =>
                                                            openDocument(docKey, 'view', label)
                                                        }
                                                    />
                                                </>
                                            )}
                                        </Flex>
                                    )}
                                </Flex>
                            );
                        })}
                    </Flex>
                )}
            </div>
        </Flex>
    );
};

export default CorporateDocumentsPage;
