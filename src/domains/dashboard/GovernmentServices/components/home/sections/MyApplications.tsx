import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Flex, Progress, Skeleton, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { ApplicationListItem } from '../../../apis';
import { useMyApplicationsApi } from '../../../hooks';
import { setSelectedApplication } from '../../../slices';

const { Title, Text } = Typography;

const API_STATUS_MAP: Record<string, { label: string; color: string; progress: number }> = {
    DRAFT:           { label: 'Draft',              color: '#8C8C8C', progress: 10 },
    SUBMITTED:       { label: 'Pending',       color: '#FA8C16', progress: 25 },
    IN_REVIEW:       { label: 'Under Review',       color: '#FA8C16', progress: 50 },
    REUPLOAD:        { label: 'Re-upload Required', color: '#FF3A3A', progress: 40 },
    APPROVED:        { label: 'Approved',            color: '#26A411', progress: 100 },
    COMPLETED:       { label: 'Completed',           color: '#26A411', progress: 100 },
    REJECTED:        { label: 'Rejected',            color: '#FF3A3A', progress: 0 },
    ACTION_REQUIRED: { label: 'Action Required',    color: '#FF3A3A', progress: 40 },
};

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const ApplicationCard = ({ application }: { application: ApplicationListItem }) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const servicesList = useAppSelector((state) => state.reducer.governmentServices.servicesList);
    const statusInfo = API_STATUS_MAP[application.status] ?? { label: application.status, color: '#8C8C8C', progress: 0 };
    const serviceName = servicesList.find((s) => s.accessKey === application.service)?.name ?? application.service;

    const handleClick = () => {
        dispatch(setSelectedApplication(application));
        navigate(`${paths.dashboard.governmentServices}/${paths.governmentServices.application}/${application.id}`);
    };

    return (
        <Flex
            vertical
            className="rounded-lg p-4 cursor-pointer"
            style={{ border: '1px solid #F0F0F0', backgroundColor: '#FCFCFC' }}
            onClick={handleClick}
        >
            <Flex justify="space-between" align="flex-start" className="mb-1">
                <Text strong className="text-sm">
                    {serviceName}
                </Text>
                <Text style={{ color: statusInfo.color }} className="text-xs font-medium">
                    {statusInfo.label}
                </Text>
            </Flex>

            <Text className="text-xs block mb-3" style={{ color: '#8C8C8C' }}>
                Application ID: {application.applicationNumber}
            </Text>

            <Flex justify="space-between" align="center" className="mb-1">
                <Text className="text-xs" style={{ color: '#8C8C8C' }}>Progress</Text>
                <Text className="text-xs" style={{ color: '#8C8C8C' }}>{statusInfo.progress}%</Text>
            </Flex>
            <Progress
                percent={statusInfo.progress}
                showInfo={false}
                strokeColor={statusInfo.color}
                trailColor="#F5F5F5"
                size={['100%', 6]}
                className="!mb-3"
            />

            <Flex gap={16}>
                <Flex align="center" gap={4}>
                    <CalendarOutlined style={{ color: '#8C8C8C', fontSize: 12 }} />
                    <Text className="text-xs" style={{ color: '#8C8C8C' }}>
                        Applied On {formatDate(application.createdAt)}
                    </Text>
                </Flex>
                <Flex align="center" gap={4}>
                    <ClockCircleOutlined style={{ color: '#8C8C8C', fontSize: 12 }} />
                    <Text className="text-xs" style={{ color: '#8C8C8C' }}>
                        Updated On {formatDate(application.updatedAt)}
                    </Text>
                </Flex>
            </Flex>
        </Flex>
    );
};

const MyApplications = () => {
    const { applications, isLoading } = useMyApplicationsApi();

    if (isLoading) {
        return (
            <Flex vertical gap={16}>
                <Skeleton active paragraph={{ rows: 1 }} title={{ width: 160 }} />
                {[1, 2].map((i) => (
                    <Skeleton key={i} active paragraph={{ rows: 3 }} />
                ))}
            </Flex>
        );
    }

    if (!applications.length) return null;

    return (
        <Flex vertical gap={16}>
            <Flex vertical gap={4}>
                <Title level={5} className="!mb-0">My Applications</Title>
                <Text className="text-xs" style={{ color: '#8C8C8C' }}>
                    Track the status of all your government registrations.
                </Text>
            </Flex>

            <Flex vertical gap={12}>
                {applications.map((application) => (
                    <ApplicationCard key={application.id} application={application} />
                ))}
            </Flex>
        </Flex>
    );
};

export default MyApplications;
