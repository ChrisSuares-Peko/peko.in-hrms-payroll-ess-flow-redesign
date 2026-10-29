import React, { useEffect, useMemo, useRef, useState } from 'react';

import { InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';
import {
    Card,
    Checkbox,
    Typography,
    DatePicker,
    Input,
    Row,
    Col,
    Button,
    Tooltip,
    Skeleton,
    Modal,
    Flex,
} from 'antd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useLocation, useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { paths } from '@src/routes/paths';

import SalaryStatusBadge from '../components/salaryStatusBadge';
import { useEmployeeSalaryListing } from '../hooks/employeeProfileHooks/useEmployeeSalaryListing';
import { useGetEmployeeSalaryApi } from '../hooks/employeeSalaryHooks/salaryTableHooks/useGetSalaryProcessDetailsApi';
import { SalaryInfo } from '../types/salaryProfileTypes/employeeSalaryTable';
import { getInitials } from '../utils/employeeDetails/data';
import { getMonthName } from '../utils/general/formatter';
import { allowanceKeys, formatCurrency, salaryProfileNewColumns } from '../utils/salaryTable/data';

const { Title, Text } = Typography;
dayjs.extend(utc)

const SalaryProfileNew: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const routeState = (location.state || {}) as {
        month?: number | string;
        year?: number | string;
    };

    const currentDate = new Date();
    const fallbackMonth = currentDate.getMonth() + 1;
    const fallbackYear = currentDate.getFullYear();
    const [isSendPayslip, setIsSendPayslip] = useState(false);
    const [payingDate, setPayingDate] = useState(dayjs());

    const selectedMonth = Number(routeState.month);
    const selectedYear = Number(routeState.year);
    const month =
        Number.isFinite(selectedMonth) && selectedMonth >= 1 && selectedMonth <= 12
            ? selectedMonth
            : fallbackMonth;
    const year =
        Number.isFinite(selectedYear) && selectedYear > 0 ? selectedYear : fallbackYear;

    const [searchText, setSearchText] = useState('');
    const [showMarkAsPaidModal, setShowMarkAsPaidModal] = useState(false);

    // The month-wide status/counts/total must come from a proper aggregate over every
    // Salary doc for the month (getSalaryInfo, via the same /salary-details endpoint the
    // "Initiate to Salary Rollout" review page uses) — not from salaryResponse.rows[0],
    // which is just one arbitrary (and, once employees exceed a page, possibly not even
    // present) employee's own row. That arbitrary-row approach could show "Approved"/"Paid"
    // for the whole month even while a late-added employee still has a PENDING salary, or
    // vice versa.
    const { data: processSalaryData, getProcessSalaryList } = useGetEmployeeSalaryApi();
    useEffect(() => {
        if (month && year) {
            getProcessSalaryList(month, year);
        }
    }, [month, year, getProcessSalaryList]);

    const paymentStatus = (processSalaryData?.data?.paymentStatus || '').toLowerCase();
    const isApproved = paymentStatus === 'approved';
    const isPartiallyPaid = paymentStatus === 'partially_paid';
    const isPending = paymentStatus === 'pending';
    const isPaid = paymentStatus === 'paid';
    // Distinguishes the two flavors of PARTIALLY_PAID: an outstanding employee still
    // PENDING (nothing risky has happened for them yet — safe to auto-approve, same as a
    // plain-pending month) vs already APPROVED (awaiting "Mark as Paid" only — nothing left
    // to auto-approve). Covers a late-added employee backfilled into an already-paid month.
    const hasPendingOutstanding = (processSalaryData?.data?.outstandingStatus || '') === 'PENDING';

    // While anything is still outstanding this month (a brand-new month, or one with a
    // late-added employee mixed in among everyone else already settled), the review list
    // shows ONLY the outstanding employee(s) — that's what "Run Payroll"/"Mark as Paid" is
    // actually asking HR to look at. This must include APPROVED as well as PENDING: once
    // "Run Payroll" approves a late-added employee (PENDING -> APPROVED) alongside others
    // already PAID, the outstanding one is now APPROVED, not PENDING, and a PENDING-only
    // filter would fall through to showing everyone again. Once nothing is outstanding,
    // show the full employee list.
    const employeeListFilter = isPending || isPartiallyPaid ? 'PENDING,APPROVED' : '';

    const {
        salaryResponse,
        loading,
        fetchSalaryData,
        handleMarkAsPaid,
        // Only used by the "Mark as Approved" button below, which is currently commented
        // out (no salary payouts yet) — kept here so that button can be re-enabled as-is.
        // handleMarkAsApproved,
        handleApproveAndRecord,
        approveLoading,
    } = useEmployeeSalaryListing(year, month, searchText, employeeListFilter);
    const showSkeleton = loading && !salaryResponse ;

    // A genuinely fresh month (every Salary doc still PENDING) and a late-added employee
    // backfilled into an already-paid month (PARTIALLY_PAID, but their own doc is still
    // PENDING) both auto-approve the same way — "Run Payroll" one-clicks the still-pending
    // employee(s) straight to APPROVED. The bulk-approve call is scoped to PENDING docs
    // only, so already-PAID employees elsewhere in the month are never touched. Once the
    // outstanding employee is already APPROVED (awaiting "Mark as Paid" only), there's
    // nothing left to auto-approve. Guarded to fire once per mount so re-fetching
    // processSalaryData after the approve call (which flips outstandingStatus away from
    // 'PENDING') can't re-trigger it.
    const autoApproveTriggeredRef = useRef(false);
    useEffect(() => {
        if (hasPendingOutstanding && !autoApproveTriggeredRef.current) {
            autoApproveTriggeredRef.current = true;
            handleApproveAndRecord(dayjs(), false).then(success => {
                if (success) {
                    getProcessSalaryList(month, year);
                    // employeeListFilter's VALUE doesn't change here (a late-added
                    // employee going PENDING -> APPROVED alongside others already PAID
                    // stays 'PENDING,APPROVED' either way), so the row-list hook's own
                    // filter-change-triggered refetch never fires on its own — refetch
                    // explicitly so the table picks up the employee's new APPROVED status
                    // instead of showing it as still PENDING (or, if a stale in-flight
                    // request from initial mount lands after this, the wrong full list).
                    fetchSalaryData();
                }
            });
        }
    }, [hasPendingOutstanding, handleApproveAndRecord, getProcessSalaryList, fetchSalaryData, month, year]);
    const columns = salaryProfileNewColumns({
        month:Number(routeState.month),
        year:Number(routeState.year)
    }, navigate);
    const isUpcoming = paymentStatus.includes('upcoming');
    // Only used by the "Initiate to Salary Rollout"/"Mark as Approved" buttons below,
    // currently commented out (no salary payouts yet).
    // const paidViaRollout = salaryResponse?.rows?.[0]?.paidViaRollout;

    const tableData = useMemo(
        () =>
            (salaryResponse?.rows || []).map(row => {
                const salaryInformation = (row.salaryInformation || {}) as SalaryInfo;
                const totalAllowance = allowanceKeys.reduce(
                    (sum, key) => sum + Number(salaryInformation[key] || 0),
                    0
                );
                // Same columns/figures as the Salary Details page (employeeSalaryColumns /
                // useGetAllEmployeeSalaryApi) so the two pages agree on this month's numbers
                // instead of showing a different split.
                const grossIncome = Number(salaryInformation.basicPay || 0) + totalAllowance;
                const oneTimeAmount =
                    Number(row.totalBonus || 0) + Number(row.totalIncentive || 0) + Number(row.totalOvertime || 0);
                const tds = Number(salaryInformation.tdsAmount || 0);
                // Statutory (PF/ESI/PT/LWF) + leave deductions only — TDS gets its own
                // column, same as the Salary Details page.
                // One-time recoveries (Add Deduction) count too — they come off net pay.
                const totalDeductionsExclTds =
                    Number(salaryInformation.deductionAmount || 0) +
                    Number(salaryInformation.leavesAmount || 0) +
                    Number(row.totalOtherDeduction || 0);
                const netSalaryBeforeTax = grossIncome - totalDeductionsExclTds;

                return {
                    key: row.id,
                    name: row.employee.personalInformation.fullName || '-',
                    employeeId: row.employee.employeeInformation.employeeId || '-',
                    designation: row.employee.employeeInformation.designation || '-',
                    department: row.department?.departmentName || '-',
                    grossIncome: formatCurrency(grossIncome),
                    oneTimeAmount,
                    lossOfPayDays: Number(row.lossOfPay?.days || 0),
                    lossOfPayAmount: Number(row.lossOfPay?.amount || 0),
                    totalDeductions: formatCurrency(totalDeductionsExclTds),
                    netSalaryBeforeTax: formatCurrency(netSalaryBeforeTax),
                    tds: formatCurrency(tds),
                    netSalary: formatCurrency(Number(row.totalPayable || 0)),
                    status: row.paymentStatus || 'N/A',
                    initials: getInitials(row.employee.personalInformation.fullName || ''),
                    bankDetails:row?.bankDetails || [],
                    id:row.employee.id || ""
                };
            }),
        [salaryResponse]
    );

    const salaryCycleText =
        salaryResponse?.salaryCycle?.salaryCycleStart && salaryResponse?.salaryCycle?.salaryCycleEnd
            ? `${dayjs.utc(salaryResponse.salaryCycle.salaryCycleStart).format('DD-MM-YYYY')} - ${dayjs.utc(salaryResponse.salaryCycle.salaryCycleEnd).format('DD-MM-YYYY')}`
            : '-';

    return (
        <Row className="w-full min-h-screen flex-col bg-white pb-10">
            <Col>
                <Title level={3} className="mt-0 mb-6 text-xl font-semibold text-[#3B3B3B]">
                    Review Salary Details
                </Title>

                <Card className="mt-7 rounded-2xl border border-[#e5e7eb] shadow-sm">
                    {showSkeleton ? (
                        <Skeleton active paragraph={{ rows: 5 }} />
                    ) : (
                    <Row gutter={10}>
                                <Col md={3}>
                                    <Col className="flex flex-col gap-1">
                                        <Text className=" font-semibold text-[#4b5563]">Paying Date</Text>
                                        <DatePicker
                                            placeholder="Calendar"
                                            value={payingDate}
                                            disabled={isUpcoming}
                                            onChange={value => setPayingDate(value || dayjs())}
                                        />
                                    </Col>
                                </Col>

                                <Col md={2}>
                                    <Col className="flex flex-col gap-2">
                                        <Text className="text-center font-semibold text-[#4b5563]">
                                            Month{' '}
                                            <Tooltip title="To change the month, go back to the Employee Salary page...">
                                                <InfoCircleOutlined style={{ color: '#1890ff', marginLeft: 4 }} />
                                            </Tooltip>
                                        </Text>
                                        <Text className=" font-medium text-[#1f2937] text-center">
                                            {getMonthName(month)}
                                        </Text>
                                    </Col>
                                </Col>

                                <Col md={5}>
                                    <Col className="flex flex-col gap-2">
                                        <Text className="text-center font-semibold text-[#4b5563]">Salary Cycle</Text>
                                        <Text className=" font-medium text-[#1f2937] text-center">{salaryCycleText}</Text>
                                    </Col>
                                </Col>

                                <Col md={3}>
                                    <Col className="flex flex-col gap-2">
                                        <Text className=" font-semibold text-[#4b5563]">No. of working days</Text>
                                        <Text className=" font-medium text-[#1f2937]">
                                            {salaryResponse?.salaryCycle?.workingDays || 0} Days
                                        </Text>
                                    </Col>
                                </Col>

                                <Col md={3}>
                                    <Col className="flex flex-col gap-2">
                                        <Text className=" font-semibold text-[#4b5563]">Number of employees</Text>
                                        <Text className=" font-medium text-[#1f2937]">
                                            {isPartiallyPaid
                                                ? `${processSalaryData?.data?.noOfEmployees ?? 0} (of ${processSalaryData?.data?.totalEmployeesInMonth ?? 0})`
                                                : salaryResponse?.count || 0}
                                        </Text>
                                    </Col>
                                </Col>

                                <Col md={4}>
                                    <Col className="flex flex-col gap-2">
                                        <Text className=" font-semibold text-[#4b5563]">Total Payable</Text>
                                        <Text strong className=" text-[#111827]">
                                            {formatCurrency(
                                                Number(
                                                    isPartiallyPaid
                                                        ? processSalaryData?.data?.totalPayable || 0
                                                        : salaryResponse?.totalPayableSum || 0
                                                )
                                            )}
                                        </Text>
                                    </Col>
                                </Col>
                                <Col md={4}>
                                    <SalaryStatusBadge
                                        status={(processSalaryData?.data?.paymentStatus || '').toUpperCase()}
                                        pendingCount={processSalaryData?.data?.noOfEmployees}
                                    />
                                    <Flex vertical gap={8} className="mt-2">
                                        <Button
                                            type="primary"
                                            danger
                                            className="w-full"
                                            // Enabled once approved (the normal flow) OR
                                            // when a late-added employee's own PENDING
                                            // salary is the only thing left this month —
                                            // that case goes straight to Paid without ever
                                            // passing through Approved, per the pending
                                            // employee's own back-filled path. The backend
                                            // (markSalaryAsPaid) only ever touches docs that
                                            // are still PENDING/APPROVED, so it can't
                                            // re-settle anyone already paid earlier.
                                            disabled={(!isApproved && !isPartiallyPaid) || isPaid || isUpcoming}
                                            onClick={() => setShowMarkAsPaidModal(true)}
                                            loading={approveLoading}
                                        >
                                            Mark as Paid
                                        </Button>
                                        {/* Hidden for now — no salary payouts yet.
                                        <Button
                                            danger
                                            className="w-full"
                                            disabled={isUpcoming || isPaid}
                                            onClick={() =>
                                                navigate(
                                                    `/${paths.payroll.index}/${paths.payroll.salaryProcess}`,
                                                    { state: { month, year } }
                                                )
                                            }
                                        >
                                            Initiate to Salary Rollout
                                        </Button>
                                        <Button
                                            danger
                                            className="w-full"
                                            disabled={!isPaid || isUpcoming || paidViaRollout !== false}
                                            onClick={async () => {
                                                const isSuccess = await handleMarkAsApproved();
                                                if (isSuccess) {
                                                    navigate(
                                                        `/${paths.payroll.index}/${paths.payroll.employeesSalary}/${paths.payroll.payrollRecordSuccess}`,
                                                        { state: { month, year } }
                                                    );
                                                }
                                            }}
                                            loading={approveLoading}
                                        >
                                            Mark as Approved
                                        </Button>
                                        */}
                                    </Flex>
                                </Col>
                    </Row>
                    )}

                    {!showSkeleton && <Row className="mt-11">
                        <Checkbox
                            className="text-sm font-medium text-[#1f2937]"
                            checked={isSendPayslip}
                            onChange={e => setIsSendPayslip(e.target.checked)}
                        >
                            Generate and send Payslip to all the employees
                        </Checkbox>
                    </Row>}
                </Card>
            </Col>

            {isPartiallyPaid && (
                <Col xs={24} className="pt-4">
                    <Typography.Text
                        className="block rounded-lg px-4 py-3 text-sm"
                        style={{
                            background: '#FFF6EA',
                            border: '1px solid #FFE3C1',
                            color: '#B45309',
                        }}
                    >
                        {`${
                            (processSalaryData?.data?.totalEmployeesInMonth || 0) -
                            (processSalaryData?.data?.noOfEmployees || 0)
                        } of ${processSalaryData?.data?.totalEmployeesInMonth || 0} salaries for this month were already paid and recorded — only the ${
                            processSalaryData?.data?.noOfEmployees || 0
                        } pending salar${processSalaryData?.data?.noOfEmployees === 1 ? 'y is' : 'ies are'} shown below and will be covered by this approval.`}
                    </Typography.Text>
                </Col>
            )}

            <Col className='py-5'>
              
                    <Input
                        prefix={<SearchOutlined className="text-base text-[#9ca3af]" />}
                        placeholder="Search by name"
                        variant="outlined"
                        allowClear
                        value={searchText}
                        onChange={e => {
                            const value = e.target.value.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
                            setSearchText(value)
                        }}
                    />
            </Col>

            <Col>
                {showSkeleton ? (
                    <Card className="rounded-2xl border border-[#e5e7eb] shadow-sm">
                        <Skeleton active paragraph={{ rows: 8 }} />
                    </Card>
                ) : (
                    <GenericTable
                        columns={columns}
                        dataSource={tableData}
                        loading={loading}
                        pagination={false}
                        className="border-t-0"
                        rowClassName={() => 'align-middle'}
                    />
                )}
            </Col>

            <Modal
                open={showMarkAsPaidModal}
                title="Confirm Salary Disbursement"
                okText="Confirm"
                cancelText="Cancel"
                okButtonProps={{ danger: true, type: 'primary', loading: approveLoading }}
                onOk={async () => {
                    setShowMarkAsPaidModal(false);
                    const isSuccess = await handleMarkAsPaid(payingDate, isSendPayslip);
                    if (isSuccess) {
                        navigate(
                            `/${paths.payroll.index}/${paths.payroll.employeesSalary}/${paths.payroll.payrollRecordSuccess}`,
                            { state: { month, year } }
                        );
                    }
                }}
                onCancel={() => setShowMarkAsPaidModal(false)}
            >
                <Typography.Paragraph>
                    By proceeding, you confirm that salary disbursement for the selected employees
                    has been initiated outside of Peko. This action will mark their status as Paid
                    but will not trigger any payment via the Peko platform.
                </Typography.Paragraph>
            </Modal>
        </Row>
    );
};

export default SalaryProfileNew;
