import { useEffect, useState } from 'react';

import { CheckCircleFilled } from '@ant-design/icons';
import { Button, Spin, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import {
    EngagementStatus,
    GovernmentServiceApplicationV2Item,
    getEngagementStatusApi,
} from '../apis';
import TrademarkTrackingStep from '../components/TrademarkTrackingStep';
import { isGstCancellationService } from '../utils/gstCancellationForm';
import { isGstRegistrationService } from '../utils/gstForm';
import {
    buildGstCancellationTrackingSteps,
    buildGstTrackingSteps,
    buildTrademarkTrackingSteps,
    formatTrackingDate,
} from '../utils/tracking';

const { Title, Paragraph, Text } = Typography;

type TrackedApplication = Pick<
    GovernmentServiceApplicationV2Item,
    | 'id'
    | 'applicationId'
    | 'engagementId'
    | 'status'
    | 'paymentStatus'
    | 'createdOn'
    | 'serviceName'
    | 'legalBusinessName'
    // Picks the right tracking copy (GST vs Trademark vs any future service) — see
    // isGstRegistrationService below.
    | 'serviceId'
>;

// Trademark Registration's Track Application page — the clicked row from My Applications is
// passed through via route state rather than re-fetched by id.
const TrackingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);

    const application =
        (location.state as { application?: TrackedApplication } | null)?.application ?? null;
    const [engagement, setEngagement] = useState<EngagementStatus | null>(null);
    const [isLoadingEngagement, setIsLoadingEngagement] = useState(true);

    // Direct visits without an application have nothing real to show — send
    // them to My Applications instead of rendering placeholder data.
    useEffect(() => {
        if (!application) {
            navigate(
                `${paths.dashboard.governmentServices}/${paths.governmentServices.applications}`,
                {
                    replace: true,
                }
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [application]);

    useEffect(() => {
        if (!application?.engagementId) {
            setIsLoadingEngagement(false);
            return;
        }
        setIsLoadingEngagement(true);
        getEngagementStatusApi(userId, userType ?? '', application.engagementId).then(res => {
            setEngagement(res);
            setIsLoadingEngagement(false);
        });
    }, [application?.engagementId, userId, userType]);

    if (!application) return null;
    if (isLoadingEngagement) {
        return (
            <div className="bg-white min-h-screen flex items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    let steps;
    if (isGstRegistrationService(application.serviceId)) {
        steps = buildGstTrackingSteps(application, engagement);
    } else if (isGstCancellationService(application.serviceId)) {
        steps = buildGstCancellationTrackingSteps(application, engagement);
    } else {
        steps = buildTrademarkTrackingSteps(application, engagement);
    }
    const submittedOn = formatTrackingDate(application.createdOn);

    return (
        <div className="bg-white min-h-screen p-3 sm:p-6">
            <div className="max-w-3xl mx-auto flex flex-col gap-6">
                <div className="text-center flex flex-col items-center gap-2">
                    <CheckCircleFilled style={{ fontSize: 40, color: '#22c55e' }} />
                    <Title
                        level={2}
                        className="!text-[24px] sm:!text-[28px] !font-semibold !text-[#1e293b] !mb-0"
                    >
                        {application.serviceName || 'Application'}
                    </Title>
                    <Paragraph className="!mb-0 text-[14px] sm:text-[16px] text-[#6a7282]">
                        Track your application&apos;s progress below.
                    </Paragraph>
                </div>

                <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 flex flex-col gap-5">
                    <div className="bg-[#eff6ff] rounded-[12px] p-4 flex items-start gap-3">
                        <CheckCircleFilled
                            style={{ fontSize: 18, color: '#2563eb' }}
                            className="mt-[2px]"
                        />
                        <div>
                            <Text className="!block !text-[15px] !font-semibold !text-[#1d4ed8]">
                                {application.legalBusinessName || 'Application'}
                            </Text>
                            <Text className="!block !text-[13px] !text-[#3b82f6]">
                                Submitted on {submittedOn}
                            </Text>
                            {/* IndiaFilings' own reference — what their RM/support recognizes. */}
                            {application.applicationId && (
                                <Text className="!text-[12px] !text-[#60a5fa]">
                                    IndiaFilings Application ID: {application.applicationId}
                                </Text>
                            )}
                        </div>
                    </div>

                    <div>
                        {steps.map((step, idx) => (
                            <TrademarkTrackingStep
                                key={step.title}
                                step={step}
                                isLast={idx === steps.length - 1}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button
                        type="primary"
                        onClick={() => navigate(`${paths.dashboard.governmentServices}/explore`)}
                        className="!h-[44px] !px-6 !text-[16px] !font-medium !rounded-[8px] !bg-[#ff4f4f] hover:!bg-[#e64444] transition-colors"
                    >
                        Back to dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TrackingPage;
