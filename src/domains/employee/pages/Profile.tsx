import { Avatar, Flex, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';

import { useEssAuth } from '@src/prototype/essSession';

import { EmployeeDepartment } from '../api/onboarding';
import BankDetailsTab from '../components/profile/BankDetailsTab';
import PersonalInfoTab from '../components/profile/PersonalInfoTab';
import { useEmployeeProfile } from '../hooks/useEmployeeProfile';

const { Text } = Typography;

const FALLBACK = '—';

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Active Employee',
    CONFIRMED: 'Confirmed',
    INPROBATION: 'In Probation',
    NEW_HIRE: 'New Hire',
    LEAVE: 'On Leave',
    SUSPENDED: 'Suspended',
    RESIGNED: 'Resigned',
};

const getInitials = (name?: string) =>
    (name || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase() || 'NA';

const displayDepartment = (department?: EmployeeDepartment | string) =>
    department && typeof department === 'object' && department.departmentName
        ? department.departmentName
        : FALLBACK;

const ProfileStat = ({ label, value }: { label: string; value: string }) => (
    <Flex vertical align="center" className="flex-1 min-w-[140px]">
        <Text className="text-xs text-gray-500">{label}</Text>
        <Text className="font-medium text-black">{value}</Text>
    </Flex>
);

const StatDivider = () => <div className="hidden h-12 w-px bg-[#e5e5e5] sm:block" />;

const Profile = () => {
    const { profile, loading, reload } = useEmployeeProfile();
    // PROTOTYPE-SETUP: ESS identity comes from useEssAuth (DEMO_EMPLOYEE when there is no token).
    const { employeeName, employeeEmail } = useEssAuth();
    const personal = profile?.personalInformation;
    const info = profile?.employeeInformation;

    const hasPayrollRecord = !!profile;
    const displayName = personal?.fullName || employeeName || FALLBACK;
    const subtitle = info?.designation || employeeEmail || FALLBACK;

    const statusLabel = info?.employeeStatus
        ? (STATUS_LABELS[info.employeeStatus] ?? info.employeeStatus)
        : FALLBACK;

    return (
        <Flex vertical gap={28} className="w-full max-w-[900px] mx-auto py-4">
            <div className="bg-white rounded-3xl shadow-[0px_1.66px_16.56px_1.52px_rgba(0,0,0,0.06)] px-8 py-7">
                {loading && !profile ? (
                    <Skeleton avatar active paragraph={{ rows: 2 }} />
                ) : (
                    <>
                        <Flex justify="space-between" align="center" gap={16} wrap="wrap">
                            <Flex gap={16} align="center">
                                <Avatar
                                    size={72}
                                    shape="square"
                                    style={{ borderRadius: 12, background: '#f9f6ff' }}
                                    src={profile?.profileImage}
                                >
                                    <Text
                                        style={{ color: '#af9ed4' }}
                                        className="text-xl font-bold"
                                    >
                                        {getInitials(displayName)}
                                    </Text>
                                </Avatar>
                                <Flex vertical>
                                    <Text className="text-xl font-bold text-black">
                                        {displayName}
                                    </Text>
                                    <Text className="text-sm text-gray-500">{subtitle}</Text>
                                </Flex>
                            </Flex>
                            {hasPayrollRecord && (
                                <Flex
                                    align="center"
                                    gap={6}
                                    className="px-3 py-1 rounded-full"
                                    style={{
                                        color: '#43b75d',
                                        backgroundColor: '#ecfdf5',
                                        border: '0.5px solid #c8f3df',
                                    }}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#43b75d]" />
                                    <Text
                                        style={{ color: '#43b75d' }}
                                        className="text-xs font-medium"
                                    >
                                        {statusLabel}
                                    </Text>
                                </Flex>
                            )}
                        </Flex>

                        {hasPayrollRecord && (
                            <Flex
                                align="center"
                                justify="space-between"
                                wrap="wrap"
                                className="mt-6 px-6 py-4 bg-[#f9f9f9] rounded-2xl"
                            >
                                <ProfileStat
                                    label="Employee ID"
                                    value={info?.employeeId || FALLBACK}
                                />
                                <StatDivider />
                                <ProfileStat
                                    label="Department"
                                    value={displayDepartment(info?.department)}
                                />
                                <StatDivider />
                                <ProfileStat
                                    label="Joined"
                                    value={
                                        info?.dateOfJoin
                                            ? dayjs(info.dateOfJoin).format('MMM YYYY')
                                            : FALLBACK
                                    }
                                />
                                <StatDivider />
                                <ProfileStat
                                    label="Reports To"
                                    value={info?.reportingStaffName || FALLBACK}
                                />
                            <StatDivider />
                            <ProfileStat
                                label="Company"
                                value={profile?.corporateUser?.companyName || FALLBACK}
                            />
                            </Flex>
                        )}
                    </>
                )}
            </div>

            {hasPayrollRecord && (
                <>
                    <PersonalInfoTab profile={profile} onRequestSubmitted={reload} />
                    <BankDetailsTab
                        bankDetails={profile?.bankDetails}
                        bankUpdateRequestPending={profile?.bankUpdateRequestPending}
                        onRequestSubmitted={reload}
                    />
                </>
            )}
        </Flex>
    );
};

export default Profile;
