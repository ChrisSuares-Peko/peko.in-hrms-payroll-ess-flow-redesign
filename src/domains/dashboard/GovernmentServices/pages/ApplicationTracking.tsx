import { useEffect, useState } from 'react';

import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Flex, Tag, Typography } from 'antd';
import { saveAs } from 'file-saver';
import { useNavigate, useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { ApplicationDraft, downloadGovernmentServiceDocumentApi, getGovernmentServiceApplicationByIdApi } from '../apis';
import { setSelectedService } from '../slices';

const { Title, Text } = Typography;

const API_STATUS_MAP: Record<string, { label: string; color: string; bg: string; completedUpTo: number }> = {
    SUBMITTED:       { label: 'Submitted',          color: '#FA8C16', bg: '#FFFBE6', completedUpTo: 0 },
    IN_REVIEW:       { label: 'Under Review',      color: '#FA8C16', bg: '#FFFBE6', completedUpTo: 1 },
    REUPLOAD:        { label: 'Re-upload Required', color: '#FF3A3A', bg: '#FFF7F6', completedUpTo: 1 },
    APPROVED:        { label: 'Approved',           color: '#26A411', bg: '#F6FFED', completedUpTo: Infinity },
    COMPLETED:       { label: 'Completed',          color: '#26A411', bg: '#F6FFED', completedUpTo: Infinity },
    REJECTED:        { label: 'Rejected',           color: '#FF3A3A', bg: '#FFF7F6', completedUpTo: 1 },
    ACTION_REQUIRED: { label: 'Action Required',   color: '#FF3A3A', bg: '#FFF7F6', completedUpTo: 1 },
};

const getStepState = (index: number, completedUpTo: number): 'completed' | 'current' | 'pending' => {
    if (index <= completedUpTo) return 'completed';
    if (index === completedUpTo + 1) return 'current';
    return 'pending';
};

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

const ApplicationTracking = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { applicationId } = useParams<{ applicationId: string }>();
    const reduxApplication = useAppSelector(state => state.reducer.governmentServices.selectedApplication);
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const servicesList = useAppSelector(state => state.reducer.governmentServices.servicesList);

    const [applicationDetail, setApplicationDetail] = useState<ApplicationDraft | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (applicationId) {
            getGovernmentServiceApplicationByIdApi(userId, role, applicationId).then((data) => {
                if (data) setApplicationDetail(data);
            });
        }
    }, [applicationId, userId, role]);

    const application = reduxApplication;

    const handleDownload = async () => {
        const docUrl = applicationDetail?.approvedDocument;
        if (!docUrl) return;
        setIsDownloading(true);
        const data = await downloadGovernmentServiceDocumentApi(userId, role, docUrl);
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);
            const blob = new Blob([arrayBuffer], { type: data.fileType });
            const decoded = decodeURIComponent(docUrl);
            const ext = decoded.split('.').pop()?.split('?')[0] || 'pdf';
            const fileName = `${serviceName.replace(/\s+/g, '_')}_Certificate.${ext}`;
            saveAs(blob, fileName);
        }
        setIsDownloading(false);
    };

    if (!application) {
        navigate(paths.dashboard.governmentServices);
        return null;
    }

    const apiService = servicesList.find((s) => s.accessKey === application.service);

    const serviceName = apiService?.name ?? 'Government Service';
    const serviceDuration = apiService?.duration;

    const statusInfo = API_STATUS_MAP[application.status] ?? {
        label: application.status,
        color: '#8C8C8C',
        bg: '#F5F5F5',
        completedUpTo: 0,
    };

    const timelineSteps = [
        { title: 'Application Submitted' },
        { title: 'Under Review' },
        { title: 'Govt Processing' },
        { title: 'Approved' },
    ];

    return (
        <Flex vertical gap={20} className="p-5 px-1">
            <Flex vertical gap={4}>
                <Title level={5} className="!mb-0">{serviceName}</Title>
                <Text className="text-xs" style={{ color: '#8C8C8C' }}>
                    Track the status of your government registration
                </Text>
            </Flex>

            <Flex vertical className='mt-5' align="center">
            <Flex vertical gap={20} style={{ width: '100%', maxWidth: 760 }}>
            {/* Application Info Card */}
            <Flex vertical gap={16} className="p-4 rounded-lg" style={{ border: '1px solid #F0F0F0' }}>
                <Flex justify="space-between" align="flex-start">
                    <Flex vertical gap={4}>
                        <Text strong className="">{serviceName}</Text>
                        <Text className="text-xs" style={{ color: '#8C8C8C' }}>
                            Application ID: {application.applicationNumber}
                        </Text>
                    </Flex>
                    {(application.status === 'SUBMITTED' || application.status === 'IN_REVIEW') && (
                        <Tag color="orange">{statusInfo.label}</Tag>
                    )}
                </Flex>

                <Flex gap={80} wrap="wrap">
                    <Flex vertical gap={4}>
                        <Text className="text-xs" style={{ color: '#8C8C8C' }}>Applied On</Text>
                        <Text className="text-xs font-medium">{formatDate(application.createdAt)}</Text>
                    </Flex>
                    <Flex vertical gap={4}>
                        <Text className="text-xs" style={{ color: '#8C8C8C' }}>Last Updated</Text>
                        <Text className="text-xs font-medium">{formatDate(application.updatedAt)}</Text>
                    </Flex>
                    {serviceDuration && (
                        <Flex vertical gap={4}>
                            <Text className="text-xs" style={{ color: '#8C8C8C' }}>Expected Completion</Text>
                            <Text className="text-xs font-medium">{serviceDuration}</Text>
                        </Flex>
                    )}
                </Flex>
            </Flex>

            {/* Status-specific banners */}
            {application.status === 'APPROVED' && (
                <Flex vertical gap={8} className="p-4 rounded-lg" style={{ backgroundColor: '#F6FFED', border: '1px solid #B7EB8F' }}>
                    <Text strong className="text-sm" style={{ color: '#26A411' }}>Application Approved!</Text>
                    <Text className="text-xs" style={{ color: '#52C41A' }}>
                        Choose how you&apos;d like to proceed:
                    </Text>
                    <Button
                        icon={<DownloadOutlined />}
                        size="small"
                        loading={isDownloading}
                        style={{ width: 'fit-content', color: '#26A411', borderColor: '#26A411' }}
                        onClick={handleDownload}
                    >
                        Download certificate
                    </Button>
                </Flex>
            )}

            {application.status === 'REUPLOAD' && (
                <Flex vertical gap={8} className="p-4 rounded-lg" style={{ backgroundColor: '#FFF7F6', border: '1px solid #FFE4E4' }}>
                    <Text strong className="text-sm" style={{ color: '#FF3A3A' }}>Re-upload Required</Text>
                    {application.adminNotes && (
                        <Text className="text-xs" style={{ color: '#FF3A3A' }}>{application.adminNotes}</Text>
                    )}
                    {application.remarks && (
                        <Text className="text-xs" style={{ color: '#FF3A3A' }}>{application.remarks}</Text>
                    )}
                    <Button
                        icon={<UploadOutlined />}
                        size="small"
                        style={{ width: 'fit-content', borderColor: '#FF3A3A', color: '#FF3A3A' }}
                        onClick={() => {
                            if (apiService) dispatch(setSelectedService(apiService));
                            navigate(
                                `${paths.dashboard.governmentServices}/service/${apiService?.id}/apply`,
                                { state: { applicationId: application.id } }
                            );
                        }}
                    >
                        Go to Application
                    </Button>
                </Flex>
            )}

            {application.status !== 'APPROVED' && application.status !== 'REUPLOAD' &&
             application.status !== 'SUBMITTED' && application.status !== 'IN_REVIEW' && (
                <Flex align="center" gap={8} className="p-4 rounded-lg" style={{ backgroundColor: statusInfo.bg, border: `1px solid ${statusInfo.color}30` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusInfo.color, flexShrink: 0 }} />
                    <Text className="text-sm font-medium" style={{ color: statusInfo.color }}>{statusInfo.label}</Text>
                </Flex>
            )}

            {/* Application Timeline */}
            <Flex vertical gap={16} className="p-4 rounded-lg" style={{ border: '1px solid #F0F0F0' }}>
                <Text strong className="text-sm">Application Timeline</Text>
                <Flex vertical gap={0}>
                    {timelineSteps.map((step, i) => {
                        const state = getStepState(i, statusInfo.completedUpTo);
                        const isLast = i === timelineSteps.length - 1;
                        const stepDate = i === 0 ? application.createdAt : application.updatedAt;
                        return (
                            <Flex key={i} gap={12}>
                                <Flex vertical align="center" style={{ flexShrink: 0 }}>
                                    <Flex
                                        align="center"
                                        justify="center"
                                        style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#FFF0F0', flexShrink: 0 }}
                                    >
                                        <Text style={{ fontSize: 11, color: '#FF3A3A', fontWeight: 500 }}>{i + 1}</Text>
                                    </Flex>
                                    {!isLast && (
                                        <div style={{ width: 1, flex: 1, minHeight: 20, backgroundColor: '#F0F0F0', margin: '4px 0' }} />
                                    )}
                                </Flex>
                                <Flex vertical gap={2} style={{ paddingBottom: isLast ? 0 : 16, justifyContent: 'center' }}>
                                    <Text className="text-sm font-medium">{step.title}</Text>
                                    {state === 'completed' && (
                                        <Text className="text-xs" style={{ color: '#8C8C8C' }}>{formatDate(stepDate)}</Text>
                                    )}
                                    {state === 'current' && (
                                        <Text className="text-xs" style={{ color: '#FF3A3A' }}>In progress...</Text>
                                    )}
                                    {state === 'pending' && (
                                        <Text className="text-xs" style={{ color: '#D9D9D9' }}>Pending</Text>
                                    )}
                                </Flex>
                            </Flex>
                        );
                    })}
                </Flex>
            </Flex>

            {/* Need Help */}
            <Flex vertical gap={8} className="p-4 rounded-lg" style={{ backgroundColor: '#FFF7F6', border: '1px solid #FFE4E4' }}>
                <Text strong className="text-sm">Need Help?</Text>
                <Text className="text-xs" style={{ color: '#8C8C8C' }}>
                    Our support team is here to assist you with any questions about your application.
                </Text>
                <Flex align="center" gap={4} className="cursor-pointer" style={{ width: 'fit-content' }} onClick={() => navigate(paths.dashboard.needHelp)}>
                    <Text className="text-xs font-medium" style={{ color: '#FF3A3A' }}>Contact Support</Text>
                    <Text style={{ color: '#FF3A3A', fontSize: 12 }}>→</Text>
                </Flex>
            </Flex>
        </Flex>
        </Flex>
        </Flex>
    );
};

export default ApplicationTracking;
