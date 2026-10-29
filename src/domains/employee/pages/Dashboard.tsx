import { Col, Flex, Row, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import AnnouncementsPanel from '../components/dashboard/AnnouncementsPanel';
import AttendanceTable from '../components/dashboard/AttendanceTable';
import ProfileCard from '../components/dashboard/ProfileCard';
import ServiceShortcuts from '../components/dashboard/ServiceShortcuts';
import StatCard from '../components/dashboard/StatCard';
import { useEmployeeDashboard } from '../hooks/useEmployeeDashboard';

const Dashboard = () => {
    const navigate = useNavigate();
    const { data, isLoading, checkInLoading, checkOutLoading, handleCheckIn, handleCheckOut } =
        useEmployeeDashboard();

    if (isLoading || !data) {
        return (
            <Flex vertical gap={24}>
                <Skeleton active paragraph={{ rows: 6 }} />
                <Skeleton active paragraph={{ rows: 6 }} />
            </Flex>
        );
    }

    return (
        <Flex vertical gap={24}>
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <ProfileCard
                        profile={data.profile}
                        checkInLoading={checkInLoading}
                        checkOutLoading={checkOutLoading}
                        onCheckIn={handleCheckIn}
                        onCheckOut={handleCheckOut}
                    />
                </Col>
                <Col xs={24} lg={8}>
                    <StatCard
                        title="Attendance"
                        stat={data.attendance}
                        onViewMore={() => navigate(paths.employee.attendance)}
                    />
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={13}>
                    <Flex vertical gap={24}>
                        <ServiceShortcuts />
                        <AttendanceTable records={data.attendanceRecords} />
                    </Flex>
                </Col>
                <Col xs={24} lg={11}>
                    <AnnouncementsPanel announcements={data.announcements} />
                </Col>
            </Row>
        </Flex>
    );
};

export default Dashboard;
