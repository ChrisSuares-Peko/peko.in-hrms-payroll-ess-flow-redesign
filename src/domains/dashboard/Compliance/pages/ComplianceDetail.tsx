import { useState, useEffect, useRef, useCallback } from 'react';

import { Button, Flex } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import {
    getComplianceDetailApi,
    getComplianceListApi,
    submitDocumentsApi,
    fetchDocumentAsBase64,
    SubmitDocumentItem,
} from '../api';
import {
    ComplianceDetailHeader,
    ComplianceSuccess,
    StepDocs,
    StepIndicator,
    StepInfo,
    StepOverview,
    SubmittedComplianceView,
} from '../components/ComplianceDetail';
import useComplianceSubmit from '../hooks/useComplianceSubmit';
import {
    clearDraft,
    selectActiveDraft,
    setActiveDraftType,
    setComplianceCompanyInfo,
    setComplianceFormStep,
} from '../slices/complianceFormSlice';
import { ComplianceDetailApiResponse } from '../types';
import { complianceHealthItems } from '../utils/data';

export default function ComplianceDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { isLoading: isSubmitting, submitCompliance } = useComplianceSubmit();
    const {
        currentStep,
        companyInfo,
        documents: savedDocuments,
    } = useAppSelector(selectActiveDraft);
    const { id: userId, role: userType } = useAppSelector(state => (state.reducer as any).auth);

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedDetail, setSubmittedDetail] = useState<ComplianceDetailApiResponse | null>(
        null
    );
    const [isLoadingDetail, setIsLoadingDetail] = useState(true);
    const [savedComplianceId, setSavedComplianceId] = useState<string | null>(null);

    const item = complianceHealthItems.find(c => c.id === id);

    // Register this compliance type as the active draft on mount
    useEffect(() => {
        if (item?.complianceType) dispatch(setActiveDraftType(item.complianceType));
    }, [item?.complianceType, dispatch]);

    // Debounced auto-save for field-level changes in StepInfo
    const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleInfoAutoSave = useCallback(
        (
            values: Record<string, string | string[] | boolean | Record<string, string | boolean>[]>
        ) => {
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
            autoSaveTimer.current = setTimeout(() => {
                dispatch(setComplianceCompanyInfo(values));
            }, 600);
        },
        [dispatch]
    );

    useEffect(() => {
        if (!item) return;
        setIsLoadingDetail(true);
        getComplianceListApi({
            userId,
            userType,
            page: 1,
            pageSize: 100,
            searchText: '',
            from: '',
            to: '',
        }).then(listResult => {
            if (!listResult || listResult.rows.length === 0) {
                setIsLoadingDetail(false);
                return;
            }
            const match = listResult.rows.find(r => r.title === item.title);
            if (!match) {
                setIsLoadingDetail(false);
                return;
            }
            getComplianceDetailApi({ userId, userType, id: match.id }).then(detail => {
                if (detail) {
                    const isPendingIncomplete =
                        (!detail.adminStatus || (detail.adminStatus as string) === 'pending') &&
                        detail.documents.length === 0;

                    if (isPendingIncomplete) {
                        if (detail.formData)
                            dispatch(setComplianceCompanyInfo(detail.formData as any));
                        setSavedComplianceId(detail.complianceId);
                        dispatch(setComplianceFormStep(2));
                    } else {
                        setSubmittedDetail(detail);
                        const isResubmit = detail.status === 'pending';
                        if (isResubmit) {
                            if (detail.formData)
                                dispatch(setComplianceCompanyInfo(detail.formData as any));
                        }
                    }
                }
                setIsLoadingDetail(false);
            });
        });
    }, [item, dispatch, userId, userType]);

    if (!item) {
        return (
            <Flex vertical align="center" justify="center" className="min-h-screen">
                <span className="text-[18px] text-[#475569]">Compliance item not found.</span>
                <Button
                    type="link"
                    className="!text-[#ff4f4f] !mt-4"
                    onClick={() =>
                        navigate(`${paths.dashboard.compliance}/${paths.compliance.health}`)
                    }
                >
                    Back to Compliance Health
                </Button>
            </Flex>
        );
    }

    const complianceType = item.complianceType ?? '';
    const isResubmit = !!(submittedDetail && submittedDetail.adminStatus === 'reopened');

    const handleInfoContinue = async (
        values: Record<string, string | string[] | boolean | Record<string, string | boolean>[]>
    ) => {
        const normalized: Record<
            string,
            string | string[] | boolean | Record<string, string | boolean>[]
        > = {};
        Object.entries(values).forEach(([k, v]) => {
            normalized[k] = v;
        });
        dispatch(setComplianceCompanyInfo(normalized));

        if (!isResubmit && !savedComplianceId) {
            const result = await submitCompliance({
                title: item.title,
                complianceType,
                category: item.category as 'one-time' | 'recurring',
                section: item.section,
                dueDate: item.due ? new Date(item.due).toISOString() : undefined,
                formData: normalized,
            });
            if (result) setSavedComplianceId(result.complianceId);
        }

        dispatch(setComplianceFormStep(2));
    };

    const handleDocsSubmit = async (documents: SubmitDocumentItem[]) => {
        let complianceId: string;

        if (isResubmit && submittedDetail) {
            ({ complianceId } = submittedDetail);
        } else if (savedComplianceId) {
            complianceId = savedComplianceId;
        } else {
            const result = await submitCompliance({
                title: item.title,
                complianceType,
                category: item.category as 'one-time' | 'recurring',
                section: item.section,
                dueDate: item.due ? new Date(item.due).toISOString() : undefined,
                formData: companyInfo,
            });
            if (!result) {
                dispatch(
                    showToast({
                        description: 'Submission failed. Please try again.',
                        variant: 'error',
                    })
                );
                return;
            }
            ({ complianceId } = result);
        }

        let allDocuments = documents;
        if (isResubmit && submittedDetail) {
            const rejectedKeys = submittedDetail.rejectedDocumentKeys ?? [];
            const acceptedDocs = submittedDetail.documents.filter(
                d => !rejectedKeys.includes(d.key ?? '')
            );
            const acceptedDocItems = await Promise.all(
                acceptedDocs.map(async doc => {
                    const result = await fetchDocumentAsBase64({ userType, userId, url: doc.url });
                    if (!result) return null;
                    return {
                        key: doc.key ?? '',
                        name: doc.name,
                        base64: result.base64,
                        mimeType: result.mimeType,
                    } as SubmitDocumentItem;
                })
            );
            const validAccepted = acceptedDocItems.filter(
                (d): d is SubmitDocumentItem => d !== null
            );
            allDocuments = [...validAccepted, ...documents];
        }

        const docsOk = await submitDocumentsApi({
            userType,
            userId,
            complianceId,
            documents: allDocuments,
            ...(isResubmit ? { formData: companyInfo } : {}),
        });

        if (docsOk) {
            dispatch(clearDraft(complianceType));
            setIsSubmitted(true);
        } else {
            dispatch(
                showToast({
                    description: 'Documents upload failed. Please try again.',
                    variant: 'error',
                })
            );
        }
    };

    const handleResubmitInfoContinue = (values: Record<string, unknown>) => {
        dispatch(setComplianceCompanyInfo(values as any));
    };

    const handleBack = () => {
        if (currentStep > 0) dispatch(setComplianceFormStep(currentStep - 1));
        else navigate(-1);
    };

    if (isSubmitted) {
        return (
            <Flex vertical className="min-h-screen bg-white pb-10">
                <Flex justify="center">
                    <div
                        className="bg-white rounded-[36px] w-full max-w-[823px] mt-10"
                        style={{ boxShadow: '0px 1.56px 15.58px 4px rgba(0,0,0,0.06)' }}
                    >
                        <div className="p-8 sm:p-14">
                            <ComplianceSuccess />
                        </div>
                    </div>
                </Flex>
            </Flex>
        );
    }

    return (
        <Flex vertical gap={40} className="min-h-screen bg-white pb-10">
            <Flex justify="center">
                <div
                    className="bg-white rounded-[36px] w-full max-w-[823px]"
                    style={{ boxShadow: '0px 1.56px 15.58px 4px rgba(0,0,0,0.06)' }}
                >
                    <Flex vertical gap={40} className="p-8 sm:p-14">
                        <ComplianceDetailHeader
                            item={item}
                            hideAlert={!!(isLoadingDetail || submittedDetail)}
                        />

                        {isLoadingDetail || submittedDetail ? (
                            <SubmittedComplianceView
                                detail={submittedDetail}
                                isLoading={isLoadingDetail}
                                complianceType={complianceType}
                                item={item}
                                canReupload={isResubmit}
                                onReupload={handleDocsSubmit}
                                isSubmitting={isSubmitting}
                                onInfoContinue={isResubmit ? handleResubmitInfoContinue : undefined}
                                savedValues={companyInfo}
                            />
                        ) : (
                            <>
                                <StepIndicator currentStep={currentStep} />

                                {currentStep === 0 && (
                                    <StepOverview
                                        item={item}
                                        onBack={handleBack}
                                        onContinue={() => dispatch(setComplianceFormStep(1))}
                                    />
                                )}
                                {currentStep === 1 && (
                                    <StepInfo
                                        complianceType={complianceType}
                                        onBack={handleBack}
                                        onContinue={handleInfoContinue}
                                        onChange={handleInfoAutoSave}
                                        savedValues={companyInfo}
                                        isContinuing={isSubmitting}
                                    />
                                )}
                                {currentStep === 2 && (
                                    <StepDocs
                                        complianceType={complianceType}
                                        onBack={handleBack}
                                        onSubmit={handleDocsSubmit}
                                        isSubmitting={isSubmitting}
                                        savedDocuments={savedDocuments}
                                    />
                                )}
                            </>
                        )}
                    </Flex>
                </div>
            </Flex>
        </Flex>
    );
}
