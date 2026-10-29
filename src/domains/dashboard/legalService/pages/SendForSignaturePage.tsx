import { useCallback, useEffect, useState } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Checkbox, Divider, Flex, Spin, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';

import TypographyText from '@components/atomic/typography/typographyText';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { fetchLegalDocumentById, downloadDocument } from '../api';
import SendSuccessModal from '../components/sendForSignature/SendSuccessModal';
import SignerCard, { SignerValues } from '../components/sendForSignature/SignerCard';
import PDFViewer, { SignatureField } from '../components/shared/PDFViewer';
import useSendForESign from '../hooks/useSendForESign';

const SIGNER_COLORS = [
    { bg: '#D9EECC', border: '#05BE63', text: '#15803D' },
    { bg: '#DBEAFE', border: '#3B82F6', text: '#1D4ED8' },
    { bg: '#FEF9C3', border: '#EAB308', text: '#A16207' },
];

interface Signer extends SignerValues {
    id: number;
}

const defaultSigners: Signer[] = [
    { id: 1, name: '', email: '', phone: '', signingPolicy: 'QUICKSIGN' },
];

const SendForSignaturePage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { documentId } = useParams<{ documentId: string }>();
    const { role, id: userId } = useAppSelector(s => s.reducer.auth);
    const { user } = useAppSelector(s => s.reducer.user);
    const { sendForESign, isSending } = useSendForESign();

    const [docTitle, setDocTitle] = useState('');
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isLoadingDoc, setIsLoadingDoc] = useState(true);
    const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
    const [signers, setSigners] = useState<Signer[]>(defaultSigners);
    const [expandedIndex, setExpandedIndex] = useState<number>(0);
    const [errorIndexes, setErrorIndexes] = useState<number[]>([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [sequentialSignature, setSequentialSignature] = useState(false);

    useEffect(() => {
        if (!documentId) return;
        const load = async () => {
            setIsLoadingDoc(true);
            const doc = await fetchLegalDocumentById({ userId, userType: role, documentId });
            if (doc) setDocTitle(doc.title ?? '');
            const result = await downloadDocument({ userId, userType: role, documentId });
            if (result && 'blob' in result) {
                const file = new File([result.blob], `${doc?.title ?? 'document'}.pdf`, {
                    type: 'application/pdf',
                });
                setPdfFile(file);
            } else {
                dispatch(
                    showToast({
                        description:
                            result && 'error' in result
                                ? result.error
                                : 'Could not load document PDF.',
                        variant: 'error',
                    })
                );
            }
            setIsLoadingDoc(false);
        };
        load();
    }, [documentId, userId, role, dispatch]);

    const handleSignerChange = useCallback(
        (id: number, values: SignerValues) => {
            setSigners(prev => prev.map(s => (s.id === id ? { ...s, ...values } : s)));
            const idx = signers.findIndex(s => s.id === id);
            if (idx !== -1) setErrorIndexes(prev => prev.filter(i => i !== idx));
        },
        [signers]
    );

    const handleDelete = (id: number, idx: number) => {
        setSigners(prev => prev.filter(s => s.id !== id));
        setSignatureFields(prev =>
            prev
                .filter(f => f.signerIndex !== idx)
                .map(f => ({
                    ...f,
                    signerIndex: f.signerIndex > idx ? f.signerIndex - 1 : f.signerIndex,
                }))
        );
        setErrorIndexes(prev => prev.filter(i => i !== idx).map(i => (i > idx ? i - 1 : i)));
        if (expandedIndex === idx) setExpandedIndex(0);
    };

    const addSigner = () => {
        const newId = Math.max(...signers.map(s => s.id)) + 1;
        setSigners(prev => [
            ...prev,
            { id: newId, name: '', email: '', phone: '', signingPolicy: 'QUICKSIGN' },
        ]);
        setExpandedIndex(signers.length);
    };

    const handleSend = async () => {
        if (!pdfFile) {
            dispatch(showToast({ description: 'Document not loaded yet.', variant: 'error' }));
            return;
        }
        const errors = signers
            .map((s, idx) => (!s.name.trim() || !s.email.trim() ? idx : -1))
            .filter(i => i !== -1);
        if (errors.length > 0) {
            setErrorIndexes(errors);
            setExpandedIndex(errors[0]);
            dispatch(
                showToast({ description: 'Please fill all signer details.', variant: 'error' })
            );
            return;
        }
        const missingSig = signers.findIndex(
            (_, idx) => !signatureFields.some(f => f.signerIndex === idx)
        );
        if (missingSig !== -1) {
            dispatch(
                showToast({
                    description: 'Please place at least one signature field for each signer.',
                    variant: 'error',
                })
            );
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            const documentBase64 = reader.result?.toString() ?? '';

            const signersByIndex = new Map<number, SignatureField[]>();
            signatureFields.forEach(f => {
                if (!signersByIndex.has(f.signerIndex)) signersByIndex.set(f.signerIndex, []);
                signersByIndex.get(f.signerIndex)!.push(f);
            });

            const signers_info = Array.from(signersByIndex.entries()).map(
                ([signerIndex, fields]) => {
                    const signer = signers[signerIndex];
                    return {
                        signer_name: signer?.name ?? '',
                        signer_email: signer?.email ?? '',
                        signer_mobile: signer?.phone ?? '',
                        signingPolicy: signer?.signingPolicy ?? 'QUICKSIGN',
                        sequence: signerIndex + 1,
                        page_number: [...new Set(fields.map(f => String(f.page)))],
                        signer_position: fields.map(f => ({
                            page: f.page,
                            page_height: f.pageHeight,
                            page_width: f.pageWidth,
                            x1: f.x1,
                            x2: f.x2,
                            y1: f.y1,
                            y2: f.y2,
                        })),
                    };
                }
            );

            const success = await sendForESign({
                docket_title: docTitle,
                documentBase64,
                expiry_date: dayjs().add(30, 'days').format('YYYY-MM-DD'),
                initiator_email: user?.email || '',
                reminder: false,
                sequentialSignature,
                sourceType: 'LEGAL_DOCUMENT',
                sourceId: Number(documentId),
                signers_info,
                termsofUse: true,
            });

            if (success) setShowSuccessModal(true);
        };
        reader.readAsDataURL(pdfFile);
    };

    if (isLoadingDoc) {
        return (
            <Flex justify="center" align="center" style={{ minHeight: 400 }}>
                <Spin size="large" />
            </Flex>
        );
    }

    const sectionHeader = (
        <Flex vertical gap={1} className="mb-4">
            <TypographyText className="text-2xl leading-8 font-semibold text-gray-900">
                Send for e-Signature
            </TypographyText>
            <TypographyText className="text-lg leading-7 text-gray-500">
                Add recipients and place signature fields
            </TypographyText>
        </Flex>
    );

    const signersPanel = (
        <Flex
            vertical
            className="w-full mt-4 pt-16 xl:mt-0 xl:ml-6 xl:w-[340px] shrink-0 self-stretch"
        >
            <Flex
                vertical
                gap={12}
                className="rounded-[18px] p-4 flex-1 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
            >
                <Typography.Text className="text-md font-semibold text-[#1E293B]">
                    Customer Signature
                </Typography.Text>
                <Divider
                    style={{
                        margin: '0 -16px',
                        width: 'calc(100% + 32px)',
                        minWidth: 'calc(100% + 32px)',
                    }}
                />
                <Checkbox
                    checked={sequentialSignature}
                    disabled={signers.length <= 1}
                    onChange={e => setSequentialSignature(e.target.checked)}
                >
                    <Flex align="center" gap={7}>
                        Enable sequential signing
                        <Tooltip
                            title="Signers will receive email invitation only after previous signers have completed the eSign."
                            placement="bottomLeft"
                            color="white"
                            overlayInnerStyle={{ color: '#171717' }}
                            overlayStyle={{ minWidth: 300 }}
                        >
                            <InfoCircleOutlined className="text-[#A0A0A0]" />
                        </Tooltip>
                    </Flex>
                </Checkbox>
                {signers.map((signer, idx) => (
                    <SignerCard
                        key={signer.id}
                        index={idx}
                        values={{
                            name: signer.name,
                            email: signer.email,
                            phone: signer.phone,
                            signingPolicy: signer.signingPolicy,
                        }}
                        fieldsCount={signatureFields.filter(f => f.signerIndex === idx).length}
                        isExpanded={expandedIndex === idx}
                        onExpand={() => setExpandedIndex(prev => (prev === idx ? -1 : idx))}
                        onChange={values => handleSignerChange(signer.id, values)}
                        onDelete={
                            signers.length > 1 ? () => handleDelete(signer.id, idx) : undefined
                        }
                        hasError={errorIndexes.includes(idx)}
                        otherEmails={signers
                            .filter((_, i) => i !== idx)
                            .map(s => s.email)
                            .filter(Boolean)}
                    />
                ))}
                <Button
                    onClick={addSigner}
                    className="w-full border-[#FF3A3A] text-[#FF3A3A] hover:!border-[#e02020] hover:!text-[#e02020] text-sm font-medium rounded-lg"
                >
                    + Add New Signer
                </Button>
            </Flex>
        </Flex>
    );

    return (
        <>
            <Flex gap={0} className="pt-4 flex-col xl:flex-row" align="stretch">
                <Flex vertical className="flex-1 min-w-0 w-full">
                    {sectionHeader}
                    {pdfFile ? (
                        <PDFViewer
                            file={pdfFile}
                            signatureFields={signatureFields}
                            editable
                            onSignatureFieldsChange={setSignatureFields}
                            getSignerName={idx => signers[idx]?.name || `Signer ${idx + 1}`}
                            getSignerColor={idx => SIGNER_COLORS[idx % SIGNER_COLORS.length]}
                        />
                    ) : (
                        <Flex justify="center" align="center" style={{ minHeight: 400 }}>
                            <TypographyText className="text-gray-400">
                                Document PDF not available.
                            </TypographyText>
                        </Flex>
                    )}
                </Flex>
                {signersPanel}
            </Flex>
            <Flex gap={12} justify="flex-end" className="mt-4">
                <Button
                    size="large"
                    onClick={() => navigate(-1)}
                    className="border-[#FF3A3A] text-[#FF3A3A] hover:!border-[#e02020] hover:!text-[#e02020] font-medium rounded-lg px-8"
                >
                    Back
                </Button>
                <Button
                    type="primary"
                    size="large"
                    loading={isSending}
                    onClick={handleSend}
                    className="!bg-[#FF3A3A] hover:!bg-[#e02020] !border-[#FF3A3A] font-medium rounded-lg px-8"
                >
                    Send for e-Signature
                </Button>
            </Flex>
            <SendSuccessModal
                open={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    navigate(`/more-services/legal-service/document/${documentId}/details`);
                }}
                onTrackStatus={() => {
                    setShowSuccessModal(false);
                    navigate(`/more-services/legal-service/document/${documentId}/details`);
                }}
                signerCount={signers.length}
            />
        </>
    );
};

export default SendForSignaturePage;
