import { Col, Flex, List, Row, Skeleton, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { TodayAttendanceCounts, activities } from '../../types/dashboardTypes';

interface ActivityListProps {
    isLoading: boolean;
    activities: activities[];
    viewCalendarRef: React.RefObject<HTMLDivElement>;
    colorPrimary: string;
    todayAttendance?: TodayAttendanceCounts;
}

const ActivityList: React.FC<ActivityListProps> = ({
    isLoading,
    activities: activityList,
    viewCalendarRef,
    colorPrimary,
    todayAttendance,
}: ActivityListProps) => {
    const navigate = useNavigate();

    const attendanceStats = [
        { count: todayAttendance?.present ?? 0, label: 'Present', subLabel: 'On time' },
        { count: todayAttendance?.late ?? 0, label: 'Late', subLabel: 'After start time' },
        { count: todayAttendance?.absent ?? 0, label: 'Absent', subLabel: 'No clock-in' },
        { count: todayAttendance?.onLeave ?? 0, label: 'On Leave', subLabel: 'Approved' },
    ];

    return (
        <div
            className="min-h-full flex flex-col gap-6 p-6 rounded-3xl"
            style={{ backgroundColor: '#F5F5F5' }}
        >
            {/* Today's Attendance */}
            <div>
                <Flex justify="space-between" align="center" className="mb-4">
                    <Typography.Text className="text-lg font-medium text-[#323232]">
                        Today&apos;s Attendance
                    </Typography.Text>
                    <Typography.Text
                        className="text-sm cursor-pointer"
                        style={{ color: colorPrimary }}
                        onClick={() => navigate(`/${paths.payroll.index}/${paths.payroll.timesheet}`)}
                    >
                        View more
                    </Typography.Text>
                </Flex>
                <Row gutter={[12, 12]}>
                    {attendanceStats.map((stat, i) => (
                        <Col span={12} key={i}>
                            <div className="bg-white rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                                <div
                                    className="rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: '#f8f8f8', width: 35, height: 35 }}
                                >
                                    <Typography.Text
                                        className="text-base font-extrabold"
                                        style={{ color: colorPrimary }}
                                    >
                                        {stat.count}
                                    </Typography.Text>
                                </div>
                                <Typography.Text className="text-sm text-black">
                                    <span className="font-semibold">{stat.label}</span>
                                    {` - ${stat.subLabel}`}
                                </Typography.Text>
                            </div>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* Activities */}
            <div>
                {isLoading ? (
                    <Skeleton />
                ) : (
                    <List
                        bordered={false}
                        split={false}
                        dataSource={activityList}
                        header={
                            <Flex className="mb-2" justify="space-between" style={{ borderBottom: 'none' }}>
                                <Typography.Text className="text-lg font-medium">
                                    Activities
                                </Typography.Text>
                                <div ref={viewCalendarRef}>
                                    <Link to={`/${paths.payroll.index}/${paths.payroll.activityCalendar}`}>
                                        <Typography.Text
                                            className="text-sm"
                                            style={{ color: colorPrimary, display: 'inline-block' }}
                                        >
                                            View Calendar
                                        </Typography.Text>
                                    </Link>
                                </div>
                            </Flex>
                        }
                        renderItem={(item, i) => (
                            <List.Item
                                key={i}
                                className="bg-white rounded-2xl mb-3 shadow-sm"
                                style={{ padding: '16px', margin: '0 8px 12px 8px' }}
                            >
                                <Flex vertical gap="small" className="w-full">
                                    <Typography.Text className="text-base font-semibold text-[#141414]">
                                        {item.title}
                                    </Typography.Text>
                                    <Typography.Text className="text-sm text-[#707070]">
                                        {item.body}
                                    </Typography.Text>
                                    <Typography.Text className="text-end text-textGreen text-sm">
                                        {item.start.substring(0, 10)}
                                    </Typography.Text>
                                </Flex>
                            </List.Item>
                        )}
                    />
                )}
            </div>
        </div>
    );
};

export default ActivityList;
