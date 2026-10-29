// EmployeeTableColumns.tsx
import { InfoCircleFilled } from '@ant-design/icons';
import { Avatar, Flex, Tag, Tooltip, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import moment from 'moment';
import { NavigateFunction } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import EmploymentStageTag from '../../components/employeeDetails/EmploymentStageTag';
import ViewMore from '../../components/ViewMore';
import { Employee } from '../../types/types';

type ColumnProps = {
    employeeStatus: 'active' | 'past';
    onDelete: (id: string) => void;
    navigate: NavigateFunction;
    onOffboard: (record: Employee) => void;
    onCancelOffboard: (record: Employee) => void;
};

const OFFBOARDING_STATUS_MAP: Record<string, string> = {
    RESIGNATION: 'resigned',
    SUSPENSION: 'suspended',
};

const STATUS_TAG_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
    active: {
        bg: '#F6FFED',
        color: '#52C41A',
        label: 'Active',
    },
    inprobation: {
        bg: '#F9F0FF',
        color: '#722ED1',
        label: 'In Probation',
    },

    confirmed: {
        bg: '#E6F7FF',
        color: '#1677FF',
        label: 'Confirmed',
    },
    suspended: {
        bg: '#FFF7E6',
        color: '#FAAD14',
        label: 'Suspended',
    },
    resigned: {
        bg: '#FFF1F0',
        color: '#FF4D4F',
        label: 'Resigned',
    },
    notice_period: {
        bg: '#FFF7E6',
        color: '#D46B08',
        label: 'Notice period',
    },
};

const getInitials = (name: string): string =>
    name
        .split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 3)
        .toUpperCase();

export const getEmployeeTableColumns = ({
    employeeStatus,
    onDelete,
    navigate,
    onOffboard,
    onCancelOffboard,
}: ColumnProps): TableColumnsType<Employee> => [
    {
        title: 'Name',
        dataIndex: ['personalInformation', 'fullName'],
        sorter: true,
        render: (text: string, record) => (
            <Flex gap={10}>
                <Flex
                    align="center"
                    onClick={() =>
                        navigate(paths.payroll.employeeProfile, {
                            state: { employeeId: record.id },
                        })
                    }
                    // style={{ cursor: record.isCompleted ? 'pointer' : 'default' }}
                    style={{ cursor: 'pointer' }} // right now letting the user visit the profile without checking the condition
                >
                    {record.profileImage ? (
                        <Avatar
                            src={record.profileImage}
                            style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}
                        />
                    ) : (
                        <Avatar style={{ backgroundColor: '#fde3cf', color: 'red' }}>
                            {getInitials(text)}
                        </Avatar>
                    )}
                </Flex>

                <Flex
                    vertical
                    justify="center"
                    onClick={() =>
                        navigate(paths.payroll.employeeProfile, {
                            state: { employeeId: record.id },
                        })
                    }
                    style={{ cursor: 'pointer' }}
                >
                    <Typography.Text>
                        {text}{' '}
                        {record.offBoardingInformation?.lastWorkingDay &&
                            employeeStatus === 'active' &&
                            moment(record.offBoardingInformation.lastWorkingDay).isSameOrAfter(
                                moment(),
                                'day'
                            ) && (
                                <Tooltip
                                    title={`This employee is under notice period. Last working day: ${moment(
                                        record.offBoardingInformation?.lastWorkingDay
                                    ).format('YYYY-MM-DD')}`}
                                >
                                    <InfoCircleFilled
                                        style={{
                                            marginLeft: '8px',
                                            color: '#1890ff',
                                            cursor: 'pointer',
                                        }}
                                    />
                                </Tooltip>
                            )}
                    </Typography.Text>
                    {record.personalInformation?.email && (
                        <Typography.Text>{record.personalInformation.email}</Typography.Text>
                    )}
                </Flex>
            </Flex>
        ),
    },
    {
        title: 'Employee ID',
        dataIndex: ['employeeInformation', 'employeeId'],
        sorter: true,
    },
    {
        title: 'Designation & Department',
        dataIndex: 'role',
        render: (_, record) => (
            <Flex vertical>
                <Typography.Text>{record.employeeInformation?.designation || '-'}</Typography.Text>
                <Typography.Text type="secondary" className="text-xs">
                    {record?.employeeInformation?.department?.departmentName || '-'}
                </Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Join Date',
        dataIndex: ['employeeInformation', 'dateOfJoin'],
        sorter: true,
        render: text => (text ? moment(text).format('YYYY-MM-DD') : '-'),
    },
    {
        title: 'Status',
        dataIndex: ['employeeInformation', 'employeeStatus'],
        key: 'employeeStatus',
        sorter: true,
        render: (_, record) => {
            if (record?.employmentStage) return <EmploymentStageTag employmentStage={record.employmentStage} />;

            const offBoardingType = record?.offBoardingInformation?.offBoardingType;

            let statusKey: string | undefined;

            if (record?.offBoardingStage === 'NOTICE_PERIOD') {
                // Still working until the last working day
                statusKey = 'notice_period';
            } else if (offBoardingType) {
                // Use offboarding status
                statusKey =
                    OFFBOARDING_STATUS_MAP[offBoardingType] || offBoardingType.toLowerCase();
            } else {
                // Fallback to employee status
                statusKey = record?.employeeInformation?.employeeStatus?.toLowerCase();
            }

            if (!statusKey) return '-';

            const status = STATUS_TAG_CONFIG[statusKey];

            if (!status) return statusKey;

            return (
                <Tag
                    color={status.bg}
                    style={{
                        color: status.color,
                        borderRadius: 50,
                        height: '22px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingInline: 10,
                        width: 'fit-content',
                    }}
                >
                    ● {status.label}
                </Tag>
            );
        },
    },
    {
        title: 'ESS Status',
        dataIndex: 'isEss',
        render: (isEss?: boolean) => {
            const cfg = isEss
                ? { label: 'Live', color: '#027A48', bg: '#ECFDF3' }
                : { label: 'Not Live', color: '#D92D20', bg: '#FEF3F2' };
            return (
                <Tag
                    bordered={false}
                    style={{
                        color: cfg.color,
                        backgroundColor: cfg.bg,
                        borderRadius: 9999,
                        height: '22px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        paddingInline: 10,
                        width: 'fit-content',
                    }}
                >
                    <span
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: cfg.color,
                            display: 'inline-block',
                        }}
                    />
                    {cfg.label}
                </Tag>
            );
        },
    },
    {
        title: employeeStatus === 'past' ? 'Last Working Day' : null,
        dataIndex: ['offBoardingInformation', 'lastWorkingDay'],
        render: text =>
            employeeStatus === 'past' && text ? moment(text).format('YYYY-MM-DD') : null,
    },
    {
        title: 'Mobile Number',
        dataIndex: ['personalInformation', 'mobileNo'],
    },
    {
        title: 'Action',
        dataIndex: 'id',
        render: (_, record) => {
            const list = [
                {
                    label: 'Update Profile',
                    path: paths.payroll.employeeProfile,
                    id: record.id,
                },
                {
                    label: 'Remove Profile',
                    action: () => onDelete(record.id),
                },
            ];
            if (!record.offBoardingInformation?.lastWorkingDay) {
                list.push({
                    label: 'Offboard Employee',
                    action: () => onOffboard(record),
                });
            } else if (record.offBoardingStage === 'NOTICE_PERIOD') {
                // Resignation withdrawn while serving notice. After the last working day it's a rehire.
                list.push({
                    label: 'Cancel Offboarding',
                    action: () => onCancelOffboard(record),
                });
            }

            return <ViewMore list={list} />;
        },
    },
];
