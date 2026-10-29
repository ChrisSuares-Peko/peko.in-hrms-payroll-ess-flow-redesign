import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { CloudUploadOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';
import { useAppDispatch } from '@src/hooks/hooks';
import { showToast } from '@src/slices/apiSlice';

import RecipientCard from './RecipientCard';
import { CUSTOMER_SIGN_COLOR } from '../../constants/style';
import { RecipientFormValues } from '../../forms/createAgreement/RecipientForm';
import type { Recipient, Step4Ref } from '../../types/createAgreement';
import PDFViewer, { SignatureField } from '../shared/PDFViewer';

interface Props {
    recipients: Recipient[];
    onUpdateRecipient: (id: number, values: RecipientFormValues) => void;
    initialFile?: File | null;
    isLoadingFile?: boolean;
    onDocumentChange?: () => void;
}

const Step4UploadDocument = forwardRef<Step4Ref, Props>(
    ({ recipients, onUpdateRecipient, initialFile, isLoadingFile, onDocumentChange }, ref) => {
        const dispatch = useAppDispatch();

        const [file, setFile] = useState<File | null>(null);
        const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
        const [isDragOverUpload, setIsDragOverUpload] = useState(false);

        const initialFileApplied = useRef(false);
        useEffect(() => {
            if (initialFile && !initialFileApplied.current) {
                initialFileApplied.current = true;
                setFile(initialFile);
            }
        }, [initialFile]);

        const handleRecipientUpdate = useCallback(
            (values: RecipientFormValues) => {
                onUpdateRecipient(recipients[0].id, values);
            },
            [onUpdateRecipient, recipients]
        );

        useImperativeHandle(ref, () => ({
            validate: () => {
                if (!file) {
                    dispatch(
                        showToast({
                            description: 'Please upload a document before continuing.',
                            variant: 'error',
                        })
                    );
                    return false;
                }
                const r = recipients[0];
                if (!r.name || !r.email) {
                    dispatch(
                        showToast({
                            description: 'Please fill customer name and email.',
                            variant: 'error',
                        })
                    );
                    return false;
                }
                if (!signatureFields.some(f => f.signerIndex === 0)) {
                    dispatch(
                        showToast({
                            description: 'Please place at least one signature on the document.',
                            variant: 'error',
                        })
                    );
                    return false;
                }
                return true;
            },
            getFile: () => file,
            getSignatureFields: () => signatureFields,
            setFile: (f: File | null) => setFile(f),
            setSignatureFields: (fields: SignatureField[]) => setSignatureFields(fields),
            canContinue: () => {
                const r = recipients[0];
                return Boolean(
                    file && r?.name && r?.email && signatureFields.some(f => f.signerIndex === 0)
                );
            },
        }));

        const handleFileSelect = (f: File) => {
            if (f.type === 'application/pdf') {
                setFile(f);
                onDocumentChange?.();
            }
        };

        const sectionHeader = (
            <Flex vertical gap={1} className="mb-4">
                <TypographyText className="text-lg font-semibold text-gray-900">
                    Upload Document &amp; E-Sign Setup
                </TypographyText>
                <TypographyText className="text-sm text-gray-500">
                    Upload your agreement document, set up your signature, and place signature
                    fields
                </TypographyText>
            </Flex>
        );

        const recipientsPanel = (
            <Flex vertical gap={12} className="w-full mt-4 xl:mt-0 xl:ml-6 xl:w-[300px] shrink-0">
                <Typography.Text className="text-sm font-semibold text-[#1E293B]">
                    Customer Details
                </Typography.Text>
                <RecipientCard
                    recipient={recipients[0]}
                    fieldsCount={signatureFields.filter(f => f.signerIndex === 0).length}
                    onUpdate={handleRecipientUpdate}
                />
            </Flex>
        );

        if (isLoadingFile && !file) {
            return (
                <Flex gap={10} className="p-4 xl:p-6 flex-col xl:flex-row" align="flex-start">
                    <Flex vertical className="flex-1 min-w-0 w-full">
                        {sectionHeader}
                        <Flex
                            className="rounded-xl border border-[#E5E7EB] overflow-hidden"
                            justify="center"
                            align="center"
                            style={{ height: 680, backgroundColor: '#F9FAFB' }}
                        >
                            <Typography.Text className="text-sm text-[#6B7280]">
                                Loading document…
                            </Typography.Text>
                        </Flex>
                    </Flex>
                    {recipientsPanel}
                </Flex>
            );
        }

        if (!file) {
            return (
                <Flex gap={10} className="p-4 xl:p-6 flex-col xl:flex-row" align="flex-start">
                    <Flex vertical className="flex-1 min-w-0 w-full">
                        {sectionHeader}
                        <label
                            htmlFor="agreement-pdf-upload"
                            className={`w-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${isDragOverUpload ? 'border-[#FF4F4F] bg-red-50' : 'border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#FF4F4F] hover:bg-red-50'}`}
                            style={{ minHeight: 360, padding: 'clamp(24px, 5vw, 64px) 24px' }}
                            onDragOver={e => {
                                e.preventDefault();
                                setIsDragOverUpload(true);
                            }}
                            onDragLeave={() => setIsDragOverUpload(false)}
                            onDrop={e => {
                                e.preventDefault();
                                setIsDragOverUpload(false);
                                const f = e.dataTransfer.files[0];
                                if (f) handleFileSelect(f);
                            }}
                        >
                            <CloudUploadOutlined className="text-5xl text-[#CBD5E1] mb-4" />
                            <Typography.Text className="text-base font-semibold text-[#374151] mb-1 block text-center">
                                Drag &amp; drop your PDF here
                            </Typography.Text>
                            <Typography.Text className="text-sm text-[#9CA3AF] mb-4 block text-center">
                                or
                            </Typography.Text>
                            <div className="h-9 px-6 flex items-center justify-center bg-[#FF4F4F] text-white text-sm font-medium rounded-lg pointer-events-none">
                                Browse File
                            </div>
                            <Typography.Text className="text-xs text-[#9CA3AF] mt-3 block text-center">
                                Supports PDF files only
                            </Typography.Text>
                            <input
                                id="agreement-pdf-upload"
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={e => {
                                    const f = e.target.files?.[0];
                                    if (f) handleFileSelect(f);
                                }}
                            />
                        </label>
                    </Flex>
                    {recipientsPanel}
                </Flex>
            );
        }

        return (
            <Flex gap={0} className="p-4 xl:p-6 flex-col xl:flex-row" align="flex-start">
                <Flex vertical className="flex-1 min-w-0 w-full">
                    {sectionHeader}
                    <PDFViewer
                        file={file}
                        signatureFields={signatureFields}
                        editable
                        onFileRemove={() => {
                            setFile(null);
                            setSignatureFields([]);
                            onDocumentChange?.();
                        }}
                        onSignatureFieldsChange={setSignatureFields}
                        getSignerName={() => recipients[0]?.name || 'Customer'}
                        getSignerColor={() => CUSTOMER_SIGN_COLOR}
                    />
                </Flex>
                {recipientsPanel}
            </Flex>
        );
    }
);

export default Step4UploadDocument;
