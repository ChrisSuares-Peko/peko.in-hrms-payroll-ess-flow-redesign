import { useEffect, useState } from 'react';

import { CheckCircleFilled } from '@ant-design/icons';
import { Col, Flex, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@routes/paths';
import { useAppSelector } from '@src/hooks/store';

import useGstr9 from '../hooks/useGstr9';
import { FilingConfirmationData } from '../types';
import { FINANCIAL_YEARS } from '../utils/data';
import AutoCalculatedReview from './gstr9/AutoCalculatedReview';
import EVCOtpStep from './gstr9/EVCOtpStep';
import FilingConfirmationStep from './gstr9/FilingConfirmationStep';
import GstrFormStep from './gstr9/GstrFormStep';
// import HsnSummaryStep from './gstr9/HsnSummaryStep';  // TODO: re-enable with step 5
import ProceedToFileStep from './gstr9/ProceedToFileStep';
import Section8AStep from './gstr9/Section8AStep';
import SelectFYStep from './gstr9/SelectFYStep';

// ─── Types ────────────────────────────────────────────────────────────────────

type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const STEPS: { id: StepId; label: string }[] = [
    { id: 1, label: 'Select FY & Fetch Draft' },
    { id: 2, label: 'Auto-Calculated Review' },
    { id: 3, label: 'Section 8A – ITC Details' },
    { id: 4, label: 'GSTR-9 Form (Tables 4–7)' },
    // { id: 5, label: 'HSN Summary & Save' },  // TODO: re-enable when HSN step is ready
    { id: 6, label: 'Proceed to File' },
    { id: 7, label: 'EVC OTP & File' },
    { id: 8, label: 'Filing Confirmation' },
];

// ─── Step Sidebar ─────────────────────────────────────────────────────────────

const StepSidebar = ({
    step,
    completedSteps,
    onSelect,
}: {
    step: StepId;
    completedSteps: Set<number>;
    onSelect: (id: StepId) => void;
}) => (
    <Row className="bg-white border border-[#e2e8f0] rounded-[14px] py-4 px-3 mt-2">
        {STEPS.map(s => {
            const isDone = completedSteps.has(s.id);
            const isActive = step === s.id;
            let textColor = '#64748b';
            if (isActive) textColor = '#ff4f4f';
            else if (isDone) textColor = '#1e293b';
            return (
                <Col span={24} key={s.id}>
                    <button
                        type="button"
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg mb-1 text-left transition-colors"
                        style={{ backgroundColor: isActive ? '#fef2f2' : 'transparent' }}
                        onClick={() => onSelect(s.id)}
                    >
                        {isDone ? (
                            <CheckCircleFilled
                                style={{ color: '#43b75d', fontSize: 20, flexShrink: 0 }}
                            />
                        ) : (
                            <span
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{
                                    backgroundColor: isActive ? '#ff4f4f' : '#f1f5f9',
                                    color: isActive ? '#fff' : '#64748b',
                                }}
                            >
                                {s.id}
                            </span>
                        )}
                        <Typography.Text
                            className="text-sm"
                            style={{
                                color: textColor,
                                fontWeight: isActive ? 500 : 400,
                                lineHeight: '20px',
                            }}
                        >
                            {s.label}
                        </Typography.Text>
                    </button>
                </Col>
            );
        })}
    </Row>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const Gstr9FilingPage = () => {
    const navigate = useNavigate();
    const { activeSetup } = useAppSelector(s => s.reducer.taxMore);

    const gstin = activeSetup?.gstin ?? '';

    const [step, setStep] = useState<StepId>(1);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [selectedFY, setSelectedFY] = useState(FINANCIAL_YEARS[1]);
    const [filingConfirmation, setFilingConfirmation] = useState<FilingConfirmationData | null>(
        null
    );

    const {
        draftData,
        isFetching,
        fetchDraft,
        section8aData,
        isFetchingSection8A,
        fetchSection8A,
        saveDraft,
        isSaving,
        proceedDraft,
        generateEvcOtp,
        isGeneratingOtp,
        fileReturn,
        isFiling,
        filingStatus,
        isFetchingFilingStatus,
        fetchFilingStatus,
        downloadPdf,
        isDownloading,
    } = useGstr9(gstin);

    const complete = (s: StepId) => setCompletedSteps(prev => new Set([...prev, s]));
    const next = (current: StepId) => {
        complete(current);
        setStep((current + 1) as StepId);
    };

    useEffect(() => {
        fetchFilingStatus();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (step === 6) proceedDraft(selectedFY);
    }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Flex vertical gap={0}>
            <Flex vertical gap={2} className="mb-4 mt-2">
                <Typography.Text
                    className="font-semibold text-base"
                    style={{ color: '#1e293b', lineHeight: '24px' }}
                >
                    GSTR-9 Annual Return
                </Typography.Text>
                <Typography.Text className="text-xs" style={{ color: '#64748b' }}>
                    FY {selectedFY} &middot; {gstin}
                </Typography.Text>
            </Flex>

            <Row gutter={[20, 20]} align="top">
                <Col xs={{ span: 24, order: 2 }} lg={{ span: 6, order: 1 }}>
                    <StepSidebar
                        step={step}
                        completedSteps={completedSteps}
                        onSelect={s => setStep(s)}
                    />
                </Col>
                <Col xs={{ span: 24, order: 1 }} lg={{ span: 18, order: 2 }} className="min-w-0">
                    {step === 1 && (
                        <SelectFYStep
                            selectedFY={selectedFY}
                            isFetching={isFetching}
                            isFetchingFilingStatus={isFetchingFilingStatus}
                            draftData={draftData}
                            filingStatus={filingStatus}
                            onFYChange={setSelectedFY}
                            onFetch={() => fetchDraft(selectedFY)}
                            onProceed={() => next(1)}
                        />
                    )}

                    {step === 2 && (
                        <AutoCalculatedReview
                            draftData={draftData}
                            nextLoading={isFetchingSection8A}
                            onBack={() => setStep(1)}
                            onNext={async () => {
                                await fetchSection8A(selectedFY);
                                next(2);
                            }}
                        />
                    )}

                    {step === 3 && (
                        <Section8AStep
                            section8aData={section8aData}
                            draftData={draftData}
                            onBack={() => setStep(2)}
                            onNext={() => next(3)}
                        />
                    )}

                    {step === 4 && (
                        <GstrFormStep
                            draftData={draftData}
                            nextLoading={isSaving}
                            onBack={() => setStep(3)}
                            onNext={async () => {
                                const ok = await saveDraft(selectedFY);
                                if (ok) {
                                    complete(4);
                                    setStep(6);
                                }
                            }}
                        />
                    )}

                    {/* step === 5 — HSN Summary & Save — disabled for now
                    {step === 5 && (
                        <HsnSummaryStep
                            onBack={() => setStep(4)}
                            onNext={() => next(5)}
                        />
                    )} */}

                    {step === 6 && (
                        <ProceedToFileStep
                            gstin={gstin}
                            financialYear={selectedFY}
                            // isProceeding={isProceeding}
                            // onProceed={() => proceedDraft(selectedFY)}
                            onBack={() => setStep(4)}
                            onNext={() => next(6)}
                        />
                    )}

                    {step === 7 && (
                        <EVCOtpStep
                            onBack={() => setStep(6)}
                            onNext={() => next(7)}
                            isGeneratingOtp={isGeneratingOtp}
                            onGenerateOtp={generateEvcOtp}
                            isFiling={isFiling}
                            onFile={async (pan, otp) => {
                                const result = await fileReturn(selectedFY, pan, otp);
                                if (!result) return false;
                                setFilingConfirmation({
                                    arn: result.ackNum,
                                    filedAt: result.filedAt,
                                    retPeriod: draftData?.formData?.ret_period ?? '',
                                    financialYear: selectedFY,
                                    gstin: draftData?.formData?.gstin ?? gstin,
                                    legalName:
                                        activeSetup?.legalName ?? activeSetup?.tradeName ?? '',
                                    aggTurnover: draftData?.formData?.aggTurnover ?? 0,
                                    igstPayable: draftData?.formData?.table9?.iamt?.txpyble ?? 0,
                                    igstItcAvailed: draftData?.formData?.table6?.itc_3b?.iamt ?? 0,
                                    igstCashPaid:
                                        draftData?.formData?.table9?.iamt?.txpaid_cash ?? 0,
                                });
                                return true;
                            }}
                        />
                    )}

                    {step === 8 && (
                        <FilingConfirmationStep
                            data={filingConfirmation}
                            isDownloading={isDownloading}
                            onDownload={() => downloadPdf(selectedFY)}
                            onDashboard={() =>
                                navigate(`${paths.dashboard.taxMore}/${paths.taxMore.gstFiling}`)
                            }
                        />
                    )}
                </Col>
            </Row>
        </Flex>
    );
};

export default Gstr9FilingPage;
