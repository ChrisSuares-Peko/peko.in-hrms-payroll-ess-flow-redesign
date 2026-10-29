/* eslint-disable react/no-unescaped-entities */
import { useEffect, useRef, useState } from 'react';

import {
    Button,
    Col,
    Flex,
    Progress,
    Row,
    Skeleton,
    Tour,
    Typography,
    theme,
} from 'antd';
import { TourProps } from 'antd/lib';
import { useNavigate } from 'react-router-dom';

import announcementIcon from '@domains/dashboard/Payroll/assets/icons/AnnouncementsNew.svg';
import companyDocumentIcon from '@domains/dashboard/Payroll/assets/icons/CompanyDocumentsNew.svg';
import ctcCalculatorIcon from '@domains/dashboard/Payroll/assets/icons/CtcCalculatorNew.svg';
import netProcessedSalaryIcon from '@domains/dashboard/Payroll/assets/icons/dashboardCoin.svg';
import activeEmployeesIcon from '@domains/dashboard/Payroll/assets/icons/dashboardUsers.svg';
import payslipIcon from '@domains/dashboard/Payroll/assets/icons/DownloadPayslipNew.svg';
import employee from '@domains/dashboard/Payroll/assets/icons/Employees_Departments.svg';
import leaveIcon from '@domains/dashboard/Payroll/assets/icons/Leaves_AttendanceNew.svg';
import nextMonthSalaryIcon from '@domains/dashboard/Payroll/assets/icons/next-month-salary.svg';
import reimbursementIcon from '@domains/dashboard/Payroll/assets/icons/ReimbursementsNew.svg';
import reportsIcon from '@domains/dashboard/Payroll/assets/icons/Reports_FormsNew.svg';
import salaryIcon from '@domains/dashboard/Payroll/assets/icons/SalaryNew.svg';
import timesheetIcon from '@domains/dashboard/Payroll/assets/icons/timesheetIcon.svg';
import ActivityList from '@domains/dashboard/Payroll/components/Dashboard/ActivityList';
import DashboardHeader from '@domains/dashboard/Payroll/components/Dashboard/DashboardHeader';
import InfoCard from '@domains/dashboard/Payroll/components/Dashboard/InfoCard';
import NavigationCards from '@domains/dashboard/Payroll/components/Dashboard/NavigationCards';
import UpcomingActivityCard from '@domains/dashboard/Payroll/components/Dashboard/UpcomingActivityCard';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { useScrollToTop } from '@src/hooks/useScrollToTop';
import useGetAddonDetails from '@src/hooks/useSubscriptionAddons';
import { paths } from '@src/routes/paths';
import { alterProductTour } from '@src/slices/userSlice';
import { accessKeys } from '@utils/accessKeys';
import { calculatePercentage } from '@utils/calculatePercentage';
import { formattedDateOnly } from '@utils/dateFormat';
import { packageAccessKeys } from '@utils/packageAccessKeys';

import useEnableProductTour from '../../Home/hooks/useEnableProductTour';
import Chart from '../components/Dashboard/Chart';
import DashboardBanner from '../components/Dashboard/DashboardBanner';
import PayrollAccessBanner from '../components/Dashboard/PayrollAccessBanner';
import DownloadPaySlipModal from '../components/modals/DownloadPaySlipModal';
import { useDashboardActivities } from '../hooks/dashboardHooks/useDashboardActivities';
import useGetEmployeeCount from '../hooks/dashboardHooks/useGetEmployeeCount';
import { useSummaryStats } from '../hooks/dashboardHooks/useSummaryStats';
import { useTodaysAttendance } from '../hooks/dashboardHooks/useTodaysAttendance';

const Dash = () => {
    const {
        token: { colorPrimary },
    } = theme.useToken();
    const navigate = useNavigate();
    useScrollToTop();

    const activeEmployessRef = useRef(null);
    const totalSalaryRef = useRef(null);
    const nextMonthSpendsRef = useRef(null);
    const employeesRef = useRef(null);
    const salaryRef = useRef(null);
    const leavesRef = useRef(null);
    const timesheetRef = useRef(null);
    const reportsRef = useRef(null);
    const announcementsRef = useRef(null);
    const reimbursementRef = useRef(null);
    const documentRef = useRef(null);
    const processSalaryRef = useRef(null);
    const addEmployeeRef = useRef(null);
    const addLeaveRef = useRef(null);
    const chartRef = useRef(null);
    const hrSettingsRef = useRef(null);
    const viewCalendarRef = useRef(null);

    const dispatch = useAppDispatch();
    const { handleUpdateTour } = useEnableProductTour();
    const { user } = useAppSelector(state => state.reducer.user);
    const [open, setOpen] = useState<boolean>(false);
    const tourShownRef = useRef(false);
    const { progress } = useAppSelector(state => state.reducer.payrollAuth);

    useEffect(() => {
        if (user && user.productTour?.payroll !== false && !tourShownRef.current) {
            tourShownRef.current = true;
            setOpen(true);
        }
    }, [user]);
    const { addonData } = useGetAddonDetails(accessKeys.payroll, packageAccessKeys.Payroll, false);
    const [openPayslipModal, setOpenPayslipModal] = useState(false);
    const { md } = useScreenSize();

    // Per-section data hooks — all share a single API call via module-level cache
    const {
        isLoading: summaryLoading,
        totalSalary,
        activeEmployees,
        nextMonthSalary,
    } = useSummaryStats();
    const { isLoading: activitiesLoading, activities } = useDashboardActivities();
    const { count, date, isLoading: countLoading } = useGetEmployeeCount(true);
    const { counts: todaysAttendance } = useTodaysAttendance();

    const steps: TourProps['steps'] = [
        {
            title: 'Welcome to Peko\u2019s Payroll',
            placement: 'center',
            description: (
                <Typography.Text className="font-thin text-white">
                    Manage your employee's personal and salary details.
                </Typography.Text>
            ),
        },
        {
            title: 'Active Employees',
            description: (
                <Typography.Text className="font-thin text-white">
                    Get a quick snapshot of your employees.
                </Typography.Text>
            ),
            target: () => activeEmployessRef.current,
        },
        {
            title: 'Total Salary',
            description: (
                <Typography.Text className="font-thin text-white">
                    Gain insight into your organization's salary expenditures.
                </Typography.Text>
            ),
            target: () => totalSalaryRef.current,
        },
        {
            title: 'Next Month Salary',
            description: (
                <Typography.Text className="font-thin text-white">
                    Plan for upcoming payments.
                </Typography.Text>
            ),
            target: () => nextMonthSpendsRef.current,
        },
        {
            title: 'Employees',
            description: (
                <Typography.Text className="font-thin text-white">
                    Dive into detailed employee information.
                </Typography.Text>
            ),
            target: () => employeesRef.current,
        },
        {
            title: 'Salary',
            description: (
                <Typography.Text className="font-thin text-white">
                    View individual salary details.
                </Typography.Text>
            ),
            target: () => salaryRef.current,
        },
        {
            title: 'Leaves',
            description: (
                <Typography.Text className="font-thin text-white">
                    Manage and track employee leave requests.
                </Typography.Text>
            ),
            target: () => leavesRef.current,
        },
        {
            title: 'Reimbursement',
            description: (
                <Typography.Text className="font-thin text-white">
                    Track employee reimbursement requests.
                </Typography.Text>
            ),
            target: () => reimbursementRef.current,
        },
        {
            title: 'Reports & Forms',
            description: (
                <Typography.Text className="font-thin text-white">
                    Access payroll reports, summaries, and statutory forms here.
                </Typography.Text>
            ),
            target: () => reportsRef.current,
        },
        {
            title: 'Announcements',
            description: (
                <Typography.Text className="font-thin text-white">
                    Create new announcements and send it to your employees.
                </Typography.Text>
            ),
            target: () => announcementsRef.current,
        },
        {
            title: 'Download Payslip',
            description: (
                <Typography.Text className="font-thin text-white">
                    Download employee payslips for a selected month and year.
                </Typography.Text>
            ),
            target: () => documentRef.current,
        },
        {
            title: 'Process Salary',
            description: (
                <Typography.Text className="font-thin text-white">
                    Streamline your payroll process.
                </Typography.Text>
            ),
            target: () => processSalaryRef.current,
            placement: 'top',
        },
        {
            title: 'Add Employee',
            description: (
                <Typography.Text className="font-thin text-white">
                    Easily onboard new team members.
                </Typography.Text>
            ),
            target: () => addEmployeeRef.current,
            placement: 'top',
        },
        {
            title: 'Payroll Settings',
            description: (
                <Typography.Text className="font-thin text-white">
                    Manage your Payroll and Organisation Settings here.
                </Typography.Text>
            ),
            target: () => hrSettingsRef.current,
            placement: 'top',
        },
        {
            title: 'View Calendar',
            description: (
                <Typography.Text className="font-thin text-white">
                    Stay organized with holidays and events.
                </Typography.Text>
            ),
            placement: 'top',
            target: () => viewCalendarRef.current,
        },
        {
            title: 'Payroll Graph',
            description: (
                <Typography.Text className="font-thin text-white">
                    View your monthly salary expenditures here.
                </Typography.Text>
            ),
            target: () => chartRef.current,
            placement: 'top',
        },
    ];

    const navMenuDetails = [
        {
            icon: employee,
            title: 'Employees & Departments',
            isActive: true,
            link: `/${paths.payroll.index}/${paths.payroll.employees}`,
            ref: employeesRef,
        },
        {
            icon: salaryIcon,
            title: 'Salary',
            isActive: true,
            link: `/${paths.payroll.index}/${paths.payroll.employeesSalary}`,
            ref: salaryRef,
        },
        {
            icon: leaveIcon,
            title: 'Leaves',
            isActive: true,
            link: `/${paths.payroll.index}/${paths.payroll.employeeLeave}`,
            ref: leavesRef,
        },
        {
            icon: timesheetIcon,
            title: 'Attendance',
            isActive: true,
            link: `/${paths.payroll.index}/${paths.payroll.timesheet}`,
            ref: timesheetRef,
        },
        {
            icon: reimbursementIcon,
            title: 'Reimbursements',
            isActive: true,
            link: `/${paths.payroll.index}/${paths.payroll.employeeReimbursement}`,
            ref: reimbursementRef,
        },
        {
            icon: companyDocumentIcon,
            title: 'Company Documents',
            isActive: true,
            link: `/${paths.payroll.index}/${paths.payroll.allDocuments}`,
            ref: documentRef,
        },
        {
            icon: reportsIcon,
            title: 'Reports & Forms',
            isActive: true,
            link: `/${paths.payroll.index}/${paths.payroll.reports}`,
            ref: reportsRef,
        },
        {
            icon: announcementIcon,
            title: 'Announcements ',
            isActive: true,
            link: `/${paths.payroll.index}/${paths.payroll.announcements}`,
            ref: announcementsRef,
        },
        {
            icon: payslipIcon,
            title: 'Download Payslip',
            isActive: true,
            link: ``,
            onClick: () => setOpenPayslipModal(true),
            ref: documentRef,
        },
        {
            icon: ctcCalculatorIcon,
            title: 'CTC Calculator',
            isActive: true,
            link: `/${paths.payroll.index}/${paths.payroll.ctcCalculator}`,
            // This icon's artwork is wider than tall (landscape illustration) — a larger
            // width keeps its rendered height comparable to the other, roughly-square icons.
            iconWidth: 75,
        },
    ];

    const dashboardDetails = [
        {
            title: 'Active Employees',
            value: activeEmployees,
            isCurrency: false,
            icon: activeEmployeesIcon,
            bgColor: 'bg-[#FFF8F2]',
            ref: activeEmployessRef,
            outOf: count ?? undefined,
        },
        {
            title: 'Net Processed Salary',
            value: totalSalary,
            isCurrency: true,
            icon: netProcessedSalaryIcon,
            bgColor: 'bg-[#ECF0FC]',
            ref: totalSalaryRef,
        },
        {
            title: 'Next Month Salary',
            value: nextMonthSalary,
            isCurrency: true,
            icon: nextMonthSalaryIcon,
            bgColor: 'bg-[#EFFAF4]',
            ref: nextMonthSpendsRef,
        },
    ];

    return (
        <>
            <PayrollAccessBanner />
            {/* Dash only ever mounts when progress === '100%' || isSkippedDasboard (see
            LandingPage.tsx's routing) — gating this banner on !isSkippedDasboard as well made
            it unreachable in every case Dash can actually render, since progress !== '100%'
            here implies isSkippedDasboard is true. progress itself is the real completeness
            signal (backend-computed from actual company profile/payroll settings/salary &
            deduction components/employees, not from wizard navigation), so it alone is what
            should gate this reminder. */}
            {progress !== '100%' && <DashboardBanner />}
            <DashboardHeader
                addEmployee={addEmployeeRef}
                addLeave={addLeaveRef}
                hrSettings={hrSettingsRef}
                processSalary={processSalaryRef}
            />
            <Row>
                <Col xl={15} className="pb-10">
                    <Row gutter={[10, 40]} className="md:pr-8">
                        {/* Info cards — each shows its own skeleton while summaryLoading.
                        Wrapped in their own Row so the KPI strip gets the design's 15px gap
                        independently of the outer Row's 40px vertical gutter. */}
                        <Col span={24}>
                            <Row gutter={[15, 15]}>
                                {dashboardDetails.map((item, i) => (
                                    <Col
                                        xs={24}
                                        sm={12}
                                        md={8}
                                        lg={12}
                                        xl={8}
                                        xxl={8}
                                        key={i}
                                        className="flex"
                                    >
                                        {summaryLoading ? (
                                            <Skeleton.Button
                                                active
                                                block
                                                style={{ height: 131, borderRadius: 22 }}
                                            />
                                        ) : (
                                            <InfoCard
                                                title={item.title}
                                                value={item.value}
                                                icon={item.icon}
                                                isCurrency={item.isCurrency}
                                                bgColor={item.bgColor}
                                                reference={item.ref}
                                                outOf={item.outOf}
                                            />
                                        )}
                                    </Col>
                                ))}
                            </Row>
                        </Col>

                        {md ? (
                            <div className="w-full flex flex-col gap-4">
                                <Row className="w-full" gutter={[8, 0]}>
                                    {navMenuDetails.slice(0, 6).map((item, i) => (
                                        <Col
                                            key={i}
                                            span={4}
                                            className="flex justify-center p-1 lg:p-1"
                                        >
                                            <NavigationCards
                                                icon={item.icon}
                                                title={item.title}
                                                isActive={item.isActive}
                                                link={item.link}
                                                reference={item.ref}
                                                onClick={item.onClick}
                                                iconWidth={item.iconWidth}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                                <Row className="w-full" gutter={[8, 0]}>
                                    {navMenuDetails.slice(6).map((item, i) => (
                                        <Col
                                            key={i}
                                            span={4}
                                            className="flex justify-center p-1 lg:p-1"
                                        >
                                            <NavigationCards
                                                icon={item.icon}
                                                title={item.title}
                                                isActive={item.isActive}
                                                link={item.link}
                                                reference={item.ref}
                                                onClick={item.onClick}
                                                iconWidth={item.iconWidth}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        ) : (
                            <Flex justify="center">
                                <Row gutter={[0, 15]} justify="start">
                                    {navMenuDetails.map((item, index) => (
                                        <Col xs={6} key={index}>
                                            <NavigationCards
                                                icon={item.icon}
                                                title={item.title}
                                                isActive={item.isActive}
                                                link={item.link}
                                                onClick={item.onClick}
                                                iconWidth={item.iconWidth}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            </Flex>
                        )}

                        {/* Employee count / progress section — skeleton while loading */}
                        {(summaryLoading || countLoading) && (
                            <Col span={24}>
                                <Skeleton active paragraph={{ rows: 2 }} />
                            </Col>
                        )}
                        {!summaryLoading && !countLoading && activeEmployees !== undefined && (
                            <>
                                <Col span={24}>
                                    <Flex vertical className="w-full">
                                        <Typography.Text
                                            className="font-medium "
                                            style={{ fontSize: '0.9rem' }}
                                        >
                                            Number of added employees: {count} Employee
                                            {count > 1 ? 's' : ''}
                                        </Typography.Text>

                                        <Flex
                                            align={md ? 'center' : 'self-start'}
                                            gap={10}
                                            className="flex-col w-full mt-2 align-middle items-center md:flex-row"
                                        >
                                            <Progress
                                                className="w-full mt-2 md:w-7/12 "
                                                percent={calculatePercentage(
                                                    count,
                                                    addonData?.maxLimit
                                                )}
                                                strokeColor="#05BE63"
                                            />
                                            <Typography.Text className="flex-wrap text-xs  sm:text-base xl:whitespace-nowrap ">
                                                {Math.max(
                                                    0,
                                                    Number(addonData?.maxLimit ?? 0) -
                                                        Number(count ?? 0)
                                                )}{' '}
                                                Left of {addonData?.maxLimit ?? 0} Employees
                                            </Typography.Text>

                                            {user?.roleName !== 'corporate sub user' && (
                                                <Button
                                                    danger
                                                    type="default"
                                                    className="px-4 ml-auto text-sm font-normal w-fit rounded-lg h-9"
                                                    onClick={() =>
                                                        navigate(
                                                            `${paths.payroll.payrollSettings}?activeTab=8`
                                                        )
                                                    }
                                                >
                                                    Upgrade
                                                </Button>
                                            )}
                                        </Flex>
                                        {date && (
                                            <Typography.Text
                                                className="font-medium text-gray-400"
                                                style={{ fontSize: '0.9rem' }}
                                            >
                                                Last employee added on{' '}
                                                {formattedDateOnly(new Date(date!))}
                                            </Typography.Text>
                                        )}
                                    </Flex>
                                </Col>
                                <Col xs={0} sm={0} md={24} lg={24} xl={24}>
                                    <Chart reference={chartRef} />
                                </Col>
                            </>
                        )}
                    </Row>
                </Col>

                {/* Today's Attendance + Activities panel (desktop) */}
                <Col className="min-h-40" xl={9} xs={0} md={0}>
                    <ActivityList
                        isLoading={activitiesLoading}
                        activities={activities}
                        viewCalendarRef={viewCalendarRef}
                        colorPrimary={colorPrimary}
                        todayAttendance={todaysAttendance}
                    />
                </Col>

                {/* Activities panel (mobile) */}
                <Flex className="xs:block md:hidden" vertical>
                    <Typography.Title className="ml-3" level={5}>
                        Activities
                    </Typography.Title>
                    <Row gutter={[40, 40]} className="mt-5">
                        {activitiesLoading ? (
                            <Skeleton.Input
                                style={{ width: 200, marginBottom: 8, marginTop: 4 }}
                                active
                                size="small"
                            />
                        ) : (
                            activities.map((item, i) => (
                                <Col xs={24} sm={12} md={8} lg={8} xl={8} key={i}>
                                    <UpcomingActivityCard
                                        isLoading={activitiesLoading}
                                        date={item.start}
                                        title={item.title}
                                        description={item.body}
                                        type={item.type}
                                    />
                                </Col>
                            ))
                        )}
                    </Row>
                </Flex>

                {user && md && (
                    <Tour
                        open={open}
                        disabledInteraction
                        onFinish={() => {
                            setOpen(false);
                            dispatch(alterProductTour({ ...user.productTour, payroll: false }));
                            handleUpdateTour('payroll');
                        }}
                        onClose={() => {
                            setOpen(false);
                            dispatch(alterProductTour({ ...user.productTour, payroll: false }));
                            handleUpdateTour('payroll');
                        }}
                        steps={steps}
                        arrow
                        animated
                        type="primary"
                        placement="bottom"
                        scrollIntoViewOptions
                        // eslint-disable-next-line react/jsx-no-useless-fragment
                        indicatorsRender={(current, total) => <></>}
                    />
                )}
                {openPayslipModal && (
                    <DownloadPaySlipModal
                        open={openPayslipModal}
                        handleCancel={() => setOpenPayslipModal(false)}
                        setRefresh={() => {}}
                    />
                )}
            </Row>
        </>
    );
};

export default Dash;
