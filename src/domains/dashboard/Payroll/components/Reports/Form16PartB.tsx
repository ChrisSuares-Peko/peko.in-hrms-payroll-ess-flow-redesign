// import { useEffect, useState } from 'react';

import { useEffect, useState } from 'react';

import { Col, Form, Row } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';
import * as Yup from 'yup';

import BookAdjustment from './BookAdjustmentDetail';
import ChallanDetail from './ChallanDetail';
import DeductionUnderChapter6A from './DeductionUnderChapter6A';
import DeductionUnderSec16 from './DeductionUnderSec16';
import EmployeeDetailsForm from './EmployeeDetailsForm';
import FormBVerification from './FormBVerification';
import GrossTotalIncome from './GrossTotalIncome';
import IncomeChargableAtSalary from './IncomeChargableAtSalary';
import OtherIncomeReportedByEmpl from './OtherIncomeReportedByEmpl';
import QuarterlyTDS from './QuarterlyTDS';
import SalaryIncomeDetail from './SalaryIncomeDetail';
import TaxComputation from './TaxComputation';
import TotalIncome from './TotalIncome';
import useForm16BApi from '../../hooks/reports/useForm16BApi';

const corporatePanRules = (label: string) =>
    Yup.string()
        .required(`Please enter ${label}`)
        .length(10, `${label} must be 10 characters long`)
        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, `${label} must be a valid PAN`);

const tanRules = (label: string) =>
    Yup.string()
        .required(`Please enter ${label}`)
        .length(10, `${label} must be 10 characters long`)
        .matches(/^[A-Z]{4}[0-9]{5}[A-Z]$/, `Please enter a valid TAN`);

const addressRules = (label: string) =>
    Yup.string()
        .min(3, `${label} must be at least 3 characters`)
        .test('no-leading-space', `${label} cannot start with a whitespace`, val => !val || !/^\s/.test(val))
        .test('no-trailing-space', `${label} cannot end with a whitespace`, val => !val || !/\s$/.test(val))
        .test('no-consecutive-spaces', `${label} cannot contain consecutive whitespaces`, val => !val || !/\s{2,}/.test(val));

const form16BSchema = Yup.object({
    address: addressRules('Address').required('Please enter employee address'),
    pan: corporatePanRules('Employee PAN'),
    tan: tanRules('Employee TAN'),
    employerAddress: addressRules('Address').required('Please enter employer address'),
    employerPan: corporatePanRules('PAN of Employer'),
    certificateNumber: Yup.string().required('Please enter certificate number'),
    citAddress: addressRules('Address').required('Please enter CIT address'),
});

const defaultValues = {
    employeeId: '',
    assessmentYear: '',
    // Employee details
    employee: '',
    address: '',
    pan: '',
    tan: '',
    employeeRefNo: '',
    period: [dayjs(), dayjs()],
    periodStart: dayjs(),
    periodEnd: dayjs(),
    // Employer details
    employerName: '',
    employerAddress: '',
    employerPan: '',
    employerRefNo: '',
    certificateNumber: '',
    updatedDate: dayjs(),
    citAddress: '',
    salaryIncome: {
        grossSalary: '',
        perquisitesValue: '',
        profitsInLieu: '',
        total: '',
    },
    deductions16: {
        standardDeduction: '',
        entertainmentAllowance: '',
        professionalTax: '',
        total: '',
    },
    incomeChargableAtSalary: {
        totalSalaryInc: '',
        deductionUnder16: '',
        incomeChargableUnderSal: '',
    },
    otherIncome: {
        interestIncome: '',
        otherSources: '',
        total: '',
    },
    grossTotalIncome: {
        salaries: '',
        otherIncomes: '',
        total: '',
    },
    totalIncome: {
        grossIncome: '',
        totalDeduction: '',
        totalIncome: '',
    },
    chapterVia: [
        {
            section: '80C',
            description: 'LIC, PPF, ELSS, etc.',
            amount: 0,
        },
        {
            section: '80D',
            description: 'Medical Insurance',
            amount: 0,
        },
        {
            section: '80E',
            description: 'Education Loan',
            amount: 0,
        },
        {
            section: '80G',
            description: 'Donations',
            amount: 0,
        },
        {
            section: '80CCD(1B)',
            description: 'NPS',
            amount: 0,
        },
    ],
    quarterSummary: [
        {
            quarter: 'Q1',
            receiptNumber24Q: '',
            amountPaidCredited: 0,
            taxDeducted: 0,
            taxDeposited: 0,
        },
        {
            quarter: 'Q2',
            receiptNumber24Q: '',
            amountPaidCredited: 0,
            taxDeducted: 0,
            taxDeposited: 0,
        },
        {
            quarter: 'Q3',
            receiptNumber24Q: '',
            amountPaidCredited: 0,
            taxDeducted: 0,
            taxDeposited: 0,
        },
        {
            quarter: 'Q4',
            receiptNumber24Q: '',
            amountPaidCredited: 0,
            taxDeducted: 0,
            taxDeposited: 0,
        },
    ],
    bookAdjustments: [
        {
            serialNo: 1,
            receiptNumber24G: '',
            ddoSerialNo24G: '',
            transferVoucherDate: '',
            matchingStatus: '',
        },
    ],
    challans: [
        {
            serialNo: 1,
            bsrCode: '',
            taxDepositedDate: '',
            challanSerialNo: '',
            matchingStatus: '',
        },
    ],
    taxComputation: {
        incomeTax: 0,
        surcharge: 0,
        cess: 0,
        totalTaxLiability: 0,
        tdsDeducted: 0,
        balanceOrRefund: 0,
    },
    verification: {
        declarantName: '',
        fatherOrSpouseName: '',
        capacity: '',
        amountInDeducted: '',
        amountInDeposited: '',
        date: '',
        place: '',
        designation: '',
        fullName: '',
        signatureUrl: '',
    },
};
type Form16PartAProps = {
    employee: any;
    selectedEmpId: string;
    selectedYear: string | number;
    selectedEmployee: any;
};
const Form16PartB = ({
    employee,
    selectedEmpId,
    selectedYear,
    selectedEmployee,
}: Form16PartAProps) => {
    const [initialValues, setInitialValues] = useState(defaultValues);

    const { CreateForm16BApi } = useForm16BApi();
    useEffect(() => {
        if (employee) {
            setInitialValues({
                employeeId: selectedEmpId || '',
                assessmentYear: employee?.assessmentYear || selectedYear || '',
                // Employee details
                employee:
                    employee?.employeeDetails?.name ||
                    selectedEmployee?.personalInformation?.fullName ||
                    '',
                address:
                    employee?.employeeDetails?.address ||
                    selectedEmployee?.personalInformation?.addressLine1 ||
                    '',
                pan: employee?.employeeDetails?.pan || selectedEmployee?.panNumber || '',
                tan: employee?.employeeDetails?.tan || '',
                employeeRefNo: employee?.employeeDetails?.employeeRefNo || '',
                period: [
                    employee?.employerDetails?.periodStart
                        ? dayjs(employee.employerDetails.periodStart)
                        : dayjs(),
                    employee?.employerDetails?.periodEnd
                        ? dayjs(employee.employerDetails.periodEnd)
                        : dayjs(),
                ],
                periodStart: employee?.employerDetails?.periodStart
                    ? dayjs(employee.employerDetails.periodStart)
                    : dayjs(),
                periodEnd: employee?.employerDetails?.periodEnd
                    ? dayjs(employee.employerDetails.periodEnd)
                    : dayjs(),

                // Employer details
                employerName: employee?.employerDetails?.name || '',
                employerAddress: employee?.employerDetails?.address || '',
                employerPan: employee?.employerDetails?.pan || '',
                employerRefNo: employee?.employerDetails?.employerRefNo || '',
                certificateNumber: employee?.employerDetails?.certificateNumber || '',
                updatedDate: employee?.employerDetails?.updatedDate
                    ? dayjs(employee.employerDetails.updatedDate)
                    : dayjs(),
                citAddress: employee?.employerDetails?.citAddress || '',
                // Salary and deductions
                salaryIncome: employee?.salaryIncome || {
                    grossSalary: employee?.salaryIncome?.grossSalary || '',
                    perquisitesValue: employee?.salaryIncome?.perquisitesValue || '',
                    profitsInLieu: employee?.salaryIncome?.profitsInLieu || '',
                    total: employee?.salaryIncome?.total || '',
                },
                deductions16: employee?.deductions16 || {
                    standardDeduction: employee?.deductions16?.standardDeduction || '',
                    entertainmentAllowance: employee?.deductions16?.entertainmentAllowance || '',
                    professionalTax: employee?.deductions16?.professionalTax || '',
                    total: employee?.deductions16?.total || '',
                },
                totalIncome: employee?.totalIncome || {
                    grossIncome: employee?.totalIncome?.grossIncome || '',
                    totalDeduction: employee?.totalIncome?.totalDeduction || '',
                    totalIncome: employee?.totalIncome?.totalIncome || '',
                },
                incomeChargableAtSalary: employee?.incomeChargableAtSalary || {
                    totalSalaryInc: employee?.incomeChargableAtSalary?.totalSalaryInc || 0,
                    deductionUnder16: employee?.incomeChargableAtSalary?.deductionUnder16 || 0,
                    incomeChargableUnderSal:
                        employee?.incomeChargableAtSalary?.incomeChargableUnderSal || 0,
                },
                grossTotalIncome: employee?.grossTotalIncome || {
                    salaries: employee?.grossTotalIncome?.salaries || '',
                    otherIncomes: employee?.grossTotalIncome?.otherIncomes || '',
                    total: employee?.grossTotalIncome?.total || '',
                },
                // Other sections
                otherIncome: employee?.otherIncome || {
                    interestIncome: employee?.otherIncome?.interestIncome || '',
                    otherSources: employee?.otherIncome?.otherSources || '',
                    total: employee?.otherIncome?.total || '',
                },
                chapterVia: employee?.chapterVia || defaultValues.chapterVia,
                quarterSummary:
                    employee?.quarterSummary?.map((q: any) => ({
                        ...q,
                        receiptNumber24Q: q.receiptNumber24Q || '',
                        amountPaidCredited: q.amountPaidCredited || 0,
                        taxDeducted: q.taxDeducted || 0,
                        taxDeposited: q.taxDeposited || 0,
                    })) || defaultValues.quarterSummary,
                bookAdjustments:
                    employee?.bookAdjustments?.map((b: any) => ({
                        ...b,
                        receiptNumber24G: b.receiptNumber24G || '',
                        ddoSerialNo24G: b.ddoSerialNo24G || '',
                        transferVoucherDate: b.transferVoucherDate
                            ? dayjs(b.transferVoucherDate)
                            : null,
                        matchingStatus: b.matchingStatus || '',
                    })) || defaultValues.bookAdjustments,
                challans:
                    employee?.challans?.map((c: any) => ({
                        ...c,
                        bsrCode: c.bsrCode || '',
                        taxDepositedDate: c.taxDepositedDate ? dayjs(c.taxDepositedDate) : null,
                        challanSerialNo: c.challanSerialNo || '',
                        matchingStatus: c.matchingStatus || '',
                    })) || defaultValues.challans,
                taxComputation: employee?.taxComputation || defaultValues.taxComputation,
                verification: employee?.verification || defaultValues.verification,
            });
        }
    }, [employee, selectedEmpId, selectedYear, selectedEmployee]);

    return (
        <Row className="w-full">
            <Formik
                enableReinitialize
                initialValues={{
                    ...initialValues,
                    incomeChargableAtSalary: employee?.incomeChargableAtSalary
                        ? employee?.incomeChargableAtSalary
                        : defaultValues.incomeChargableAtSalary,
                }}
                onSubmit={async (values, { setSubmitting }) => {
                    const payload = {
                        employeeId: selectedEmpId || '',
                        assessmentYear: selectedYear || '',
                        employeeDetails: {
                            name: values.employee,
                            address: values.address,
                            pan: values.pan,
                            tan: values.tan,
                            employeeRefNo: values.employeeRefNo,
                        },
                        employerDetails: {
                            name: values.employerName,
                            address: values.employerAddress,
                            pan: values.employerPan,
                            periodStart: values.period[0].format('YYYY-MM-DD'),
                            periodEnd: values.period[1].format('YYYY-MM-DD'),
                            certificateNumber: values.certificateNumber,
                            updatedDate: values.updatedDate.format('YYYY-MM-DD'),
                            citAddress: values.citAddress,
                        },
                        salaryIncome: values.salaryIncome,
                        deductions16: values.deductions16,
                        totalIncome: values.totalIncome,
                        incomeChargableAtSalary: values.incomeChargableAtSalary,
                        otherIncome: values.otherIncome,
                        grossTotalIncome: values.grossTotalIncome,
                        chapterVia: values.chapterVia,
                        quarterSummary: values.quarterSummary,
                        bookAdjustments: values.bookAdjustments,
                        challans: values.challans,
                        taxComputation: values.taxComputation,
                        verification: values.verification,
                    };

                    await CreateForm16BApi(payload);
                }}
                validationSchema={form16BSchema}
            >
                {({ handleSubmit, isSubmitting, resetForm }) => (
                    <Form layout="vertical" onFinish={handleSubmit} className="w-full px-2 sm:px-4">
                        <Row gutter={[16, 16]} className="mb-4 mt-2">
                            <Col xs={24}>
                                <EmployeeDetailsForm />
                            </Col>
                            <Col xs={24}>
                                <SalaryIncomeDetail />
                            </Col>
                            <Col xs={24}>
                                {/* <DeductionUnderSec16 values={initialValues.deductions16}/> */}
                                <DeductionUnderSec16 values={initialValues} />
                            </Col>
                            <Col xs={24}>
                                <IncomeChargableAtSalary />
                            </Col>
                            <Col xs={24}>
                                <OtherIncomeReportedByEmpl />
                            </Col>
                            <Col xs={24}>
                                <GrossTotalIncome />
                            </Col>
                            <Col xs={24}>
                                <DeductionUnderChapter6A />
                            </Col>
                            <Col xs={24}>
                                <TotalIncome />
                            </Col>
                            <Col xs={24}>
                                <TaxComputation />
                            </Col>
                            <Col xs={24}>
                                <QuarterlyTDS />
                            </Col>
                            <Col xs={24}>
                                <BookAdjustment />
                            </Col>
                            <Col xs={24}>
                                <ChallanDetail />
                            </Col>
                            <Col xs={24}>
                                <FormBVerification onSubmit={handleSubmit} />
                            </Col>
                        </Row>
                    </Form>
                )}
            </Formik>
        </Row>
    );
};
export default Form16PartB;
