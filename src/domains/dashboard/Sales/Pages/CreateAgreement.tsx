import { useEffect, useRef, useState } from 'react';

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Spin, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import dayjs from 'dayjs';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import TypographyText from '@components/atomic/typography/typographyText';
import { useAppDispatch } from '@src/hooks/hooks';
import { showToast } from '@src/slices/apiSlice';

import Step1SelectCustomer from '../components/createAgreement/Step1SelectCustomer';
import Step2AttachQuotations from '../components/createAgreement/Step2AttachQuotations';
import Step3AgreementDetails from '../components/createAgreement/Step3AgreementDetails';
import Step4UploadDocument from '../components/createAgreement/Step4UploadDocument';
import Step5Preview from '../components/createAgreement/Step5Preview';
import StepIndicator from '../components/createAgreement/StepIndicator';
import { RecipientFormValues } from '../forms/createAgreement/RecipientForm';
import useAgreementActions from '../hooks/agreement/useAgreementActions';
import useAgreementDetail from '../hooks/agreement/useAgreementDetail';
import { useBusinessDetails } from '../hooks/agreement/useBusinessDetails';
import { AgreementDetailsFormValues, Customer } from '../types/agreement';
import type { Recipient, Step3Ref, Step4Ref, Step5Ref } from '../types/createAgreement';

const TOTAL_STEPS = 5;

const getContinueLabel = (step: number, isEditMode: boolean): string => {
    if (step === TOTAL_STEPS) return 'Send for Signature & View Agreement';
    if (step === 3) return isEditMode ? 'Save Changes & Continue' : 'Save as Draft & Continue';
    return 'Continue';
};

const CreateAgreement = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { id: editId } = useParams<{ id: string }>();
    const isEditMode = !!editId;
    const { state: locationState } = useLocation() as { state: { step?: number } | null };

    const [currentStep, setCurrentStep] = useState(locationState?.step ?? 1);
    const [agreementId, setAgreementId] = useState<number | null>(null);
    const [createdAgreement, setCreatedAgreement] = useState<any>(null);

    // ── Edit mode ────────────────────────────────────────────────────────────
    const { agreement: editAgreement, isLoading: editLoading, pdfFile: editPdfFile, isPdfLoading: isEditPdfLoading } = useAgreementDetail(editId);

    // ── Business profile (Step 5) ────────────────────────────────────────────
    const { profile: businessProfile, address: businessAddress, isLoading: isBusinessLoading } = useBusinessDetails();

    // ── Step 1: Customer ─────────────────────────────────────────────────────
    const [selectedId, setSelectedId] = useState<string>('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [confirmedCustomerId, setConfirmedCustomerId] = useState<string>('');

    // ── Step 2: Quotations ───────────────────────────────────────────────────
    const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');
    const [selectedQuotationRawId, setSelectedQuotationRawId] = useState<number | undefined>(undefined);

    // ── Step 3 ───────────────────────────────────────────────────────────────
    const step3Ref = useRef<Step3Ref>(null);
    const [step3Values, setStep3Values] = useState<Partial<AgreementDetailsFormValues> | undefined>(
        undefined
    );
    const [step3DraftValues, setStep3DraftValues] = useState<
        Partial<AgreementDetailsFormValues> | undefined
    >(undefined);

    // ── Step 4 ───────────────────────────────────────────────────────────────
    const step4Ref = useRef<Step4Ref>(null);
    const step5Ref = useRef<Step5Ref>(null);
    const [recipients, setRecipients] = useState<Recipient[]>([
        { id: 1, name: '', email: '', phone: '', expanded: true, hasError: false },
    ]);
    const [step4File, setStep4File] = useState<File | null>(null);
    const [step4SignatureFields, setStep4SignatureFields] = useState<any[]>([]);
    const [canContinueStep4, setCanContinueStep4] = useState(false);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [documentChanged, setDocumentChanged] = useState(false);

    const updateRecipient = (id: number, values: RecipientFormValues) => {
        setRecipients(prev =>
            prev.map(r => (r.id === id ? { ...r, ...values, hasError: false } : r))
        );
    };

    // Update canContinue state when on step 4
    useEffect(() => {
        if (currentStep === 4) {
            setTimeout(() => {
                if (step4File) step4Ref.current?.setFile(step4File);
                if (step4SignatureFields.length > 0)
                    step4Ref.current?.setSignatureFields(step4SignatureFields);
            }, 100);

            const timer = setInterval(() => {
                if (step4Ref.current) {
                    setCanContinueStep4(step4Ref.current.canContinue());
                }
            }, 500);
            return () => clearInterval(timer);
        }
        return undefined;
    }, [currentStep, step4File, step4SignatureFields]);

    // ── Pre-fill from fetched agreement (edit mode) ──────────────────────────
    useEffect(() => {
        if (!editAgreement) return;
        const customerId = String(editAgreement.customerId);
        setSelectedId(customerId);
        setConfirmedCustomerId(customerId);
        setAgreementId(editAgreement.id);
        if (editAgreement.quotationId) {
            setSelectedQuotationId(String(editAgreement.quotationId));
            setSelectedQuotationRawId(editAgreement.quotationId);
        }
        const c = editAgreement.invoiceCustomerV2;
        setRecipients([
            {
                id: 1,
                name: c?.name ?? '',
                email: c?.email ?? '',
                phone: c?.phoneNumber ?? '',
                expanded: true,
                hasError: false,
            },
        ]);
    }, [editAgreement]);

    const step3InitialValues: Partial<AgreementDetailsFormValues> | undefined =
        step3DraftValues ||
        step3Values ||
        (editAgreement
            ? {
                  title: editAgreement.title,
                  contractType: editAgreement.contractType,
                  currency: editAgreement.currency,
                  paymentTerms: editAgreement.paymentTerms,
                  startDate: editAgreement.startDate ?? '',
                  description: editAgreement.description,
              }
            : undefined);

    // ── Actions ──────────────────────────────────────────────────────────────
    const { createAgreement, updateAgreement, isLoading, uploadDocument, sendSignRequest, isSendingSignRequest } = useAgreementActions(
        (newId?: number) => {
            if (newId) setAgreementId(newId);
            setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS));
        }
    );

    const handleStep3Submit = async (values: AgreementDetailsFormValues) => {
        setStep3Values(values);
        setStep3DraftValues(undefined);

        if (isEditMode && editId) {
            await updateAgreement(editId, {
                customerId: parseInt(confirmedCustomerId, 10),
                quotationId: selectedQuotationRawId,
                title: values.title,
                contractType: values.contractType,
                currency: values.currency,
                ...(values.paymentTerms && { paymentTerms: values.paymentTerms }),
                startDate: values.startDate,
                ...(values.description && { description: values.description }),
            });
        } else {
            const result = await createAgreement({
                customerId: parseInt(selectedId, 10),
                quotationId: selectedQuotationRawId,
                title: values.title,
                contractType: values.contractType,
                currency: values.currency,
                ...(values.paymentTerms && { paymentTerms: values.paymentTerms }),
                startDate: values.startDate,
                ...(values.description && { description: values.description }),
            });
            if (result) setCreatedAgreement(result);
        }
    };

    const handleContinue = async () => {
        if (currentStep === 1) {
            if (!selectedId) {
                dispatch(
                    showToast({
                        description: 'Please select a customer to continue.',
                        variant: 'error',
                    })
                );
                return;
            }
            setConfirmedCustomerId(selectedId);
            setRecipients([
                {
                    id: 1,
                    name: selectedCustomer?.name ?? '',
                    email: selectedCustomer?.email ?? '',
                    phone: selectedCustomer?.phone ?? '',
                    expanded: true,
                    hasError: false,
                },
            ]);
            if (isEditMode && editAgreement && String(editAgreement.customerId) !== selectedId) {
                setSelectedQuotationId('');
                setSelectedQuotationRawId(undefined);
            }
            setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS));
            return;
        }
        if (currentStep === 3) {
            step3Ref.current?.submitForm();
            return;
        }
        if (currentStep === 4) {
            const valid = step4Ref.current?.validate();
            if (!valid) return;

            const file = step4Ref.current?.getFile();
            const fields = step4Ref.current?.getSignatureFields();

            const needsUpload = !isEditMode || !editAgreement?.documentUrl || documentChanged;

            if (needsUpload && file && agreementId) {
                setIsUploadingDoc(true);
                const reader = new FileReader();
                reader.onload = async () => {
                    const base64 = reader.result?.toString().split(',')[1];
                    if (base64) {
                        const success = await uploadDocument(agreementId, {
                            documentBase64: base64,
                        });
                        setIsUploadingDoc(false);
                        if (success) {
                            if (file) setStep4File(file);
                            if (fields) setStep4SignatureFields(fields);
                            setCanContinueStep4(false);
                            setDocumentChanged(false);
                            setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS));
                        }
                    }
                };
                reader.readAsDataURL(file);
                return;
            }

            if (file) setStep4File(file);
            if (fields) setStep4SignatureFields(fields);
            setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS));
            return;
        }
        if (currentStep === TOTAL_STEPS) {
            if (!agreementId) return;

            const signersByIndex = new Map<number, typeof step4SignatureFields>();
            step4SignatureFields.forEach(f => {
                if (!signersByIndex.has(f.signerIndex)) signersByIndex.set(f.signerIndex, []);
                signersByIndex.get(f.signerIndex)!.push(f);
            });

            const signers_info = Array.from(signersByIndex.entries()).map(([signerIndex, fields]) => {
                const recipient = recipients[signerIndex];
                const pages = [...new Set(fields.map((f: any) => String(f.page)))];
                return {
                    page_number: pages,
                    sequence: signerIndex + 1,
                    signer_email: recipient?.email ?? '',
                    signer_mobile: recipient?.phone ?? '',
                    signer_name: recipient?.name ?? '',
                    signer_position: fields.map((f: any) => ({
                        page: f.page,
                        page_height: f.pageHeight,
                        page_width: f.pageWidth,
                        x1: f.x1,
                        x2: f.x2,
                        y1: f.y1,
                        y2: f.y2,
                    })),
                };
            });

            const buildAndSend = async (documentBase64: string) => {
                const initiator = step5Ref.current?.getInitiatorInfo();
                const success = await sendSignRequest({
                    docket_title: step3Values?.title || editAgreement?.title || 'agreement',
                    documentBase64,
                    expiry_date: dayjs().add(30, 'days').format('YYYY-MM-DD'),
                    initiator_email: initiator?.email ?? '',
                    initiator_name: initiator?.name ?? '',
                    reminder: false,
                    sequentialSignature: false,
                    sourceType: 'AGREEMENT',
                    sourceId: agreementId,
                    signers_info,
                    termsofUse: true,
                });
                if (success) navigate(`/sales/agreements/${agreementId}`);
            };

            if (step4File) {
                const reader = new FileReader();
                reader.onload = async () => {
                    await buildAndSend(reader.result?.toString() ?? '');
                };
                reader.readAsDataURL(step4File);
            } else {
                await buildAndSend('');
            }
            return;
        }
        setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS));
    };

    const handleBack = () => {
        if (currentStep === 1) {
            navigate(-1);
        } else if (currentStep === 3) {
            if (step3Ref.current) {
                const formValues = step3Ref.current.getFormValues?.();
                if (formValues) setStep3DraftValues(formValues);
            }
            setCurrentStep(s => s - 1);
        } else if (currentStep === 4) {
            if (step4Ref.current) {
                const file = step4Ref.current.getFile();
                const fields = step4Ref.current.getSignatureFields();
                if (file) setStep4File(file);
                if (fields) setStep4SignatureFields(fields);
            }
            setCurrentStep(s => s - 1);
        } else {
            setCurrentStep(s => s - 1);
        }
    };

    if (isEditMode && editLoading) {
        return (
            <Flex justify="center" align="center" style={{ minHeight: 400 }}>
                <Spin size="large" />
            </Flex>
        );
    }

    return (
        <Content className="px-0">
            <Flex vertical gap={2} className="mt-4 mb-6">
                <TypographyText className="text-xl font-semibold leading-7 text-gray-900">
                    {isEditMode ? 'Edit Agreement' : 'Create Agreement'}
                </TypographyText>
                <TypographyText className="text-sm text-gray-500">
                    {isEditMode
                        ? 'Update the agreement details and settings'
                        : 'Follow the steps to create and send a new contract'}
                </TypographyText>
            </Flex>

            <Flex vertical className="rounded-2xl border border-[#E5E7EB] overflow-hidden">
                <StepIndicator current={currentStep} />
                <Divider className="my-0" />

                <div className={currentStep !== 1 ? 'hidden' : ''}>
                    <Step1SelectCustomer
                        selectedId={selectedId}
                        onSelectCustomer={(id, customer) => {
                            setSelectedId(id);
                            setSelectedCustomer(customer ?? null);
                        }}
                    />
                </div>
                <div className={currentStep !== 2 ? 'hidden' : ''}>
                    <Step2AttachQuotations
                        confirmedCustomerId={confirmedCustomerId}
                        selectedQuotationId={selectedQuotationId}
                        onSelectQuotation={(id, rawId) => {
                            setSelectedQuotationId(id);
                            setSelectedQuotationRawId(rawId);
                        }}
                        onSkip={() => {
                            setSelectedQuotationId('');
                            setSelectedQuotationRawId(undefined);
                            setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS));
                        }}
                    />
                </div>
                {currentStep === 3 && (
                    <Step3AgreementDetails
                        ref={step3Ref}
                        onSubmit={handleStep3Submit}
                        initialValues={step3InitialValues}
                    />
                )}
                {currentStep === 4 && (
                    <Step4UploadDocument
                        ref={step4Ref}
                        recipients={recipients}
                        onUpdateRecipient={updateRecipient}
                        initialFile={editPdfFile}
                        isLoadingFile={editLoading || isEditPdfLoading}
                        onDocumentChange={() => setDocumentChanged(true)}
                    />
                )}
                {currentStep === 5 && (
                    <Step5Preview
                        ref={step5Ref}
                        agreementPrefix={createdAgreement?.prefix || editAgreement?.prefix}
                        agreementNumber={
                            createdAgreement?.agreementNumber ||
                            editAgreement?.agreementNumber?.toString()
                        }
                        contractType={
                            step3InitialValues?.contractType || editAgreement?.contractType
                        }
                        title={step3InitialValues?.title || editAgreement?.title}
                        description={step3InitialValues?.description || editAgreement?.description}
                        startDate={
                            step3InitialValues?.startDate
                                ? dayjs(step3InitialValues.startDate).format('DD MMM YYYY')
                                : undefined
                        }
                        createdAt={
                            (() => {
                                if (createdAgreement?.createdAt) {
                                    return dayjs(createdAgreement.createdAt).format('DD MMM YYYY');
                                }
                                if (editAgreement?.createdAt) {
                                    return dayjs(editAgreement.createdAt).format('DD MMM YYYY');
                                }
                                return undefined;
                            })()
                        }
                        paymentTerms={
                            step3InitialValues?.paymentTerms || editAgreement?.paymentTerms
                        }
                        customerName={recipients[0]?.name || editAgreement?.invoiceCustomerV2?.name}
                        customerEmail={
                            recipients[0]?.email || editAgreement?.invoiceCustomerV2?.email
                        }
                        customerPhone={
                            recipients[0]?.phone || editAgreement?.invoiceCustomerV2?.phoneNumber
                        }
                        customerAddress={
                            editAgreement?.invoiceCustomerV2
                                ? [
                                      editAgreement.invoiceCustomerV2.primaryAddress,
                                      editAgreement.invoiceCustomerV2.primaryCity,
                                      editAgreement.invoiceCustomerV2.primaryState,
                                      editAgreement.invoiceCustomerV2.primaryPincode,
                                  ]
                                      .filter(Boolean)
                                      .join(', ')
                                : undefined
                        }
                        documentUrl={editAgreement?.documentUrl}
                        documentFile={step4File}
                        signatureFields={step4SignatureFields}
                        businessProfile={businessProfile}
                        businessAddress={businessAddress}
                        isBusinessLoading={isBusinessLoading}
                    />
                )}
                <Divider className="my-0" />

                <Flex vertical gap={10} className="px-4 py-4 md:px-6">
                    <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                        <Button
                            icon={<LeftOutlined />}
                            className="h-9 px-4 rounded-lg border-[#E5E7EB] text-[#42526D] text-sm font-medium"
                            onClick={handleBack}
                        >
                            Back
                        </Button>
                        <Typography.Text className="text-xs font-medium text-[#42526D]">
                            Step {currentStep} of {TOTAL_STEPS}
                        </Typography.Text>
                        <Button
                            type="primary"
                            iconPosition="end"
                            icon={<RightOutlined />}
                            className="h-9 px-4 bg-[#FF4F4F] border-[#FF4F4F] text-white text-sm font-medium rounded-lg hover:bg-[#e64444] w-full sm:w-auto"
                            onClick={handleContinue}
                            loading={isLoading || isUploadingDoc || isSendingSignRequest}
                            disabled={currentStep === 4 && !canContinueStep4}
                        >
                            {getContinueLabel(currentStep, isEditMode)}
                        </Button>
                    </Flex>
                    {currentStep === TOTAL_STEPS && agreementId && (
                        <Typography.Text
                            className="text-center text-gray-500 text-xs font-normal underline cursor-pointer block"
                            onClick={() => navigate(`/sales/agreements/${agreementId}`)}
                        >
                            Skip
                        </Typography.Text>
                    )}
                </Flex>
            </Flex>
        </Content>
    );
};

export default CreateAgreement;
