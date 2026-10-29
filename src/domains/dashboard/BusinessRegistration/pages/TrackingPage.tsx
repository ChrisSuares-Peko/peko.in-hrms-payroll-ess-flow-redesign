import { useCallback, useEffect, useRef, useState } from 'react';

import { CheckCircleFilled, ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Spin, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import { paths } from '@routes/paths';
import { useAppSelector } from '@src/hooks/store';

import { ApplicationStatus, getApplicationStatus } from '../api';
import EngagementDocuments from '../components/EngagementDocuments';
import FeedbackModal from '../components/feedback/FeedbackModal';
import { useExitFeedback } from '../components/feedback/useExitFeedback';
import PeopleDocuments from '../components/PeopleDocuments';
import TrackingStep from '../components/TrackingStep';
import { EntityType } from '../types';
import { buildRegisterPath, STEPS_BY_ENTITY } from '../utils/data';
import {
    buildTrackingSteps,
    docReuploadInfo,
    formatTrackingDate,
    humanizeDocType,
    TRACKING_ESTIMATED,
} from '../utils/tracking';

const { Title, Paragraph, Text } = Typography;

// Poll while the vendor chain is running (SENDING), bounded.
const POLL_INTERVAL_MS = 10_000;
const MAX_POLLS = 18; // ~3 minutes

const TrackingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);

    const applicationId =
        (location.state as { applicationId?: string } | null)?.applicationId ?? '';
    const [status, setStatus] = useState<ApplicationStatus | null>(null);
    const polls = useRef(0);

    // Direct visits without an application have nothing real to show — send
    // them to My Applications instead of rendering placeholder data.
    useEffect(() => {
        if (!applicationId) {
            navigate(
                `${paths.businessRegistration.index}/${paths.businessRegistration.applications}`,
                { replace: true }
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [applicationId]);

    const fetchStatus = useCallback(async () => {
        if (!applicationId) return null;
        const res = await getApplicationStatus({
            userId: Number(userId),
            userType: userType ?? '',
            applicationId,
        });
        if (res) setStatus(res);
        return res || null;
    }, [applicationId, userId, userType]);

    useEffect(() => {
        let active = true;
        let timer: ReturnType<typeof setTimeout> | undefined;
        polls.current = 0;

        const tick = async () => {
            const res = await fetchStatus();
            if (!active) return;
            polls.current += 1;
            if (res && res.vendorStatus === 'SENDING' && polls.current < MAX_POLLS) {
                timer = setTimeout(tick, POLL_INTERVAL_MS);
            }
        };
        tick();

        return () => {
            active = false;
            if (timer) clearTimeout(timer);
        };
    }, [fetchStatus]);

    // Feedback-on-exit: nudges an RM rating once the company is incorporated and
    // the applicant leaves the tracking page.
    const feedback = useExitFeedback(status);

    if (!applicationId) return null;
    if (!status) {
        return (
            <div className="bg-white min-h-screen flex items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    const steps = buildTrackingSteps(status);
    const submittedOn = formatTrackingDate(status.submittedAt ?? status.createdAt);
    const { srn } = status;

    // A vendor doc-stage failure the applicant can fix by re-uploading — route
    // them back to the Documents step to replace the file and re-file.
    const reupload = docReuploadInfo(status);
    // A non-document vendor failure (e.g. people/KYC) can't be fixed by re-upload —
    // don't show it as "submitted"; surface it so the user retries below.
    const filingFailed = status.vendorStatus === 'FAILED' && !reupload;
    const docStep = STEPS_BY_ENTITY[status.entityType as EntityType]?.indexOf('Documents') ?? -1;
    const goReupload = () =>
        navigate(
            buildRegisterPath(status.entityType, {
                applicationId,
                ...(docStep >= 0 ? { step: docStep } : {}),
            })
        );

    // Re-upload and non-doc failures share the amber header; only the copy differs.
    const errorTitle = reupload
        ? 'Action needed to complete your filing'
        : 'We couldn’t complete your filing';
    const errorText = reupload
        ? 'A document couldn’t be verified — please re-upload it so we can file your application.'
        : 'Something needs attention before we can file your application — please review the steps below and retry.';

    return (
        <div className="bg-white min-h-screen p-3 sm:p-6">
            <div className="max-w-3xl mx-auto flex flex-col gap-6">
                <div className="text-center flex flex-col items-center gap-2">
                    {reupload || filingFailed ? (
                        <>
                            <ExclamationCircleFilled style={{ fontSize: 40, color: '#f59e0b' }} />
                            <Title
                                level={2}
                                className="!text-[24px] sm:!text-[28px] !font-semibold !text-[#1e293b] !mb-0"
                            >
                                {errorTitle}
                            </Title>
                            <Paragraph className="!mb-0 text-[14px] sm:text-[16px] text-[#6a7282]">
                                {errorText}
                            </Paragraph>
                        </>
                    ) : (
                        <>
                            <CheckCircleFilled style={{ fontSize: 40, color: '#22c55e' }} />
                            {/* "Filed with MCA" only once the SRN proves it — until then the
                                honest state is "submitted, filing in progress". */}
                            <Title
                                level={2}
                                className="!text-[24px] sm:!text-[28px] !font-semibold !text-[#1e293b] !mb-0"
                            >
                                {srn ? 'Smart form filed with MCA' : 'Application submitted'}
                            </Title>
                            <Paragraph className="!mb-0 text-[14px] sm:text-[16px] text-[#6a7282]">
                                {srn ? (
                                    <>
                                        Your SRN is{' '}
                                        <span className="text-[#ff4f4f] font-medium">{srn}</span>.
                                        Track the MCA processing status below.
                                    </>
                                ) : (
                                    <>
                                        We&apos;re taking it through MCA filing — your SRN will
                                        appear here once filing completes.
                                    </>
                                )}
                            </Paragraph>
                        </>
                    )}
                </div>

                <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 flex flex-col gap-5">
                    {/* Re-upload prompt — only when a document failed vendor validation */}
                    {reupload && (
                        <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[12px] p-4 flex flex-col gap-3">
                            <div className="flex items-start gap-2">
                                <ExclamationCircleFilled
                                    style={{ fontSize: 18, color: '#f59e0b' }}
                                    className="mt-[2px]"
                                />
                                <div>
                                    <Text className="!block !text-[15px] !font-semibold !text-[#1e293b]">
                                        Re-upload required
                                    </Text>
                                    <Text className="!block !text-[13px] !text-[#6a7282]">
                                        {reupload.failedDocs.length
                                            ? 'The document(s) below couldn’t be verified. Please replace them to continue filing.'
                                            : 'A document couldn’t be verified. Please re-upload your documents to continue filing.'}
                                    </Text>
                                </div>
                            </div>
                            {reupload.failedDocs.length > 0 && (
                                <ul className="list-disc pl-6 flex flex-col gap-1">
                                    {reupload.failedDocs.map(d => (
                                        <li key={d.docType} className="text-[13px] text-[#475569]">
                                            <span className="font-medium">
                                                {humanizeDocType(d.docType)}
                                            </span>
                                            {d.reason ? ` — ${d.reason}` : ''}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div>
                                <Button
                                    type="primary"
                                    onClick={goReupload}
                                    className="!h-[40px] !px-5 !text-[14px] !font-medium !rounded-[8px] !bg-[#ff4f4f] hover:!bg-[#e64444] transition-colors"
                                >
                                    Re-upload documents
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Application info banner */}
                    <div className="bg-[#eff6ff] rounded-[12px] p-4 flex items-start gap-3">
                        <CheckCircleFilled
                            style={{ fontSize: 18, color: '#2563eb' }}
                            className="mt-[2px]"
                        />
                        <div>
                            <Text className="!block !text-[15px] !font-semibold !text-[#1d4ed8]">
                                Application ID: {status.applicationId}
                            </Text>
                            <Text className="!block !text-[13px] !text-[#3b82f6]">
                                Submitted on {submittedOn} • Estimated completion:{' '}
                                {TRACKING_ESTIMATED}
                            </Text>
                            {/* IndiaFilings' own references — what their RM/support recognizes. */}
                            {(status.vendorApplicationId || status.engagement?.eid) && (
                                <Text className="!text-[12px] !text-[#60a5fa]">
                                    {status.vendorApplicationId
                                        ? `IndiaFilings Application ID: ${status.vendorApplicationId}`
                                        : ''}
                                    {status.vendorApplicationId && status.engagement?.eid
                                        ? ' • '
                                        : ''}
                                    {status.engagement?.eid
                                        ? `Engagement E${status.engagement.eid}`
                                        : ''}
                                </Text>
                            )}
                        </div>
                    </div>

                    {/* Status timeline */}
                    <div>
                        {steps.map((step, idx) => (
                            <TrackingStep
                                key={step.title}
                                step={step}
                                isLast={idx === steps.length - 1}
                            />
                        ))}
                    </div>

                    <PeopleDocuments people={status.peopleDocuments} />

                    {/* Incorporation deliverables — appear on the engagement post-registration */}
                    <EngagementDocuments
                        applicationId={applicationId}
                        documents={status.engagement?.documents}
                    />
                </div>

                <div className="flex justify-end">
                    <Button
                        type="primary"
                        onClick={() => navigate(paths.dashboard.home)}
                        className="!h-[44px] !px-6 !text-[16px] !font-medium !rounded-[8px] !bg-[#ff4f4f] hover:!bg-[#e64444] transition-colors"
                    >
                        Back to dashboard
                    </Button>
                </div>
            </div>

            <FeedbackModal {...feedback} />
        </div>
    );
};

export default TrackingPage;
