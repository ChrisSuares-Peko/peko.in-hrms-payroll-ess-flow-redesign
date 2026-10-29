// import { useEffect } from 'react';

import { Button, Col, Row } from 'antd';
import dayjs from 'dayjs';
import { Formik, Form as FormikForm } from 'formik';
import * as Yup from 'yup';

import useForm16AApi from '@src/domains/dashboard/Payroll/hooks/reports/useForm16AApi';

import BookAdjustmentSection from './BookAdjustmentSection';
import ChallanDetailsSection from './ChallanDetailsSection';
import EmployeeDetailsForm from './EmployeeDetailsForm';
import Form16Header from './Form16Header';
import SummaryTable from './SummaryTable';

type Form16PartAProps = {
    employee: any;
    selectedEmpId: string;
    selectedYear: string | number;
    selectedEmployee: any;
};
const nameRules = (label: string) =>
    Yup.string()
        .min(3, `${label} must be at least 3 characters`)
        .test('no-leading-space', `${label} cannot start with a whitespace`, val => !val || !/^\s/.test(val))
        .test('no-trailing-space', `${label} cannot end with a whitespace`, val => !val || !/\s$/.test(val))
        .test('no-consecutive-spaces', `${label} cannot contain consecutive whitespaces`, val => !val || !/\s{2,}/.test(val));

const addressRules = (label: string) =>
    Yup.string()
        .min(3, `${label} must be at least 3 characters`)
        .test('no-leading-space', `${label} cannot start with a whitespace`, val => !val || !/^\s/.test(val))
        .test('no-trailing-space', `${label} cannot end with a whitespace`, val => !val || !/\s$/.test(val))
        .test('no-consecutive-spaces', `${label} cannot contain consecutive whitespaces`, val => !val || !/\s{2,}/.test(val));

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

const form16ASchema = Yup.object({
    employee: nameRules('Name'),
    address: addressRules('Address').required('Please enter employee address'),
    pan: corporatePanRules('Employee PAN'),
    tan: tanRules('Employee TAN'),
    employerName: nameRules('Name'),
    employerAddress: addressRules('Address').required('Please enter employer address'),
    employerPan: corporatePanRules('PAN of Employer'),
    certificateNumber: Yup.string().required('Please enter certificate number'),
    citAddress: addressRules('Address').required('Please enter CIT address'),
});

const Form16PartA = ({
    employee,
    selectedEmpId,
    selectedYear,
    selectedEmployee,
}: Form16PartAProps) => {
    const { CreateForm16AApi } = useForm16AApi();
    return (
        <Row className="w-full">
            <Formik
                validationSchema={form16ASchema}
                initialValues={{
                    employeeId: selectedEmpId || '',
                    assessmentYear: selectedYear || '',
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
                    employerName: employee?.employerDetails?.name || '',
                    employerAddress: employee?.employerDetails?.address || '',
                    employerPan: employee?.employerDetails?.pan || '',
                    period: [
                        dayjs(employee?.employerDetails?.periodStart) || null,
                        dayjs(employee?.employerDetails?.periodEnd) || null,
                    ],
                    periodStart: employee?.employerDetails?.periodStart || '',
                    periodEnd: employee?.employerDetails?.periodEnd || '',
                    employerRefNo: '',
                    certificateNumber: employee?.employerDetails?.certificateNumber || '',
                    updatedDate: employee?.employerDetails?.updatedDate
                        ? employee.employerDetails.updatedDate
                        : '',
                    citAddress: employee?.employerDetails?.citAddress || '',

                    quarterSummary: employee?.quarterSummary?.length
                        ? employee.quarterSummary.map((q: any) => ({
                              quarter: q.quarter || '',
                              receiptNumber: q.receiptNumber || '',
                              amountPaidCredited: q.amountPaidCredited || '',
                              taxDeducted: q.taxDeducted || '',
                              taxDeposited: q.taxDeposited || '',
                          }))
                        : [
                              {
                                  quarter: 'Q1',
                                  receiptNumber: '',
                                  amountPaidCredited: '',
                                  taxDeducted: '',
                                  taxDeposited: '',
                              },
                              {
                                  quarter: 'Q2',
                                  receiptNumber: '',
                                  amountPaidCredited: '',
                                  taxDeducted: '',
                                  taxDeposited: '',
                              },
                              {
                                  quarter: 'Q3',
                                  receiptNumber: '',
                                  amountPaidCredited: '',
                                  taxDeducted: '',
                                  taxDeposited: '',
                              },
                              {
                                  quarter: 'Q4',
                                  receiptNumber: '',
                                  amountPaidCredited: '',
                                  taxDeducted: '',
                                  taxDeposited: '',
                              },
                          ],

                    bookAdjustments: employee?.bookAdjustments?.length
                        ? employee.bookAdjustments.map((b: any) => ({
                              serialNo: b.serialNo || '',
                              taxDeposited: b.taxDeposited || '',
                              receiptNumber24G: b.receiptNumber24G || '',
                              ddoSerialNo24G: b.ddoSerialNo24G || '',
                              transferVoucherDate: b.transferVoucherDate || '',
                              form24GMatchingStatus: b.form24GMatchingStatus || '',
                          }))
                        : [
                              {
                                  serialNo: 1,
                                  taxDeposited: '',
                                  receiptNumber24G: '',
                                  ddoSerialNo24G: '',
                                  transferVoucherDate: '',
                                  form24GMatchingStatus: '',
                              },
                          ],
                    challans: employee?.challans?.length
                        ? employee.challans.map((c: any) => ({
                              serialNo: c.serialNo || '',
                              taxDeposited: c.taxDeposited || '',
                              bsrCode: c.bsrCode || '',
                              taxDepositedDate: c.taxDepositedDate || '',
                              challanSerialNo: c.challanSerialNo || '',
                              oltasMatchingStatus: c.oltasMatchingStatus || '',
                          }))
                        : [
                              {
                                  serialNo: '',
                                  taxDeposited: '',
                                  bsrCode: '',
                                  taxDepositedDate: '',
                                  challanSerialNo: '',
                                  oltasMatchingStatus: '',
                              },
                          ],
                }}
                onSubmit={async values => {
                    console.log('Values:', values);
                    const payload = {
                        employeeId: selectedEmpId,
                        assessmentYear: values.assessmentYear,
                        employeeDetails: {
                            name: values.employee,
                            address: values.address,
                            pan: values.pan,
                            tan: values.tan,
                            employeeRefNo: values.employeeRefNo,
                            periodStart: values.period?.[0],
                            periodEnd: values.period?.[1],
                        },

                        employerDetails: {
                            name: values.employerName,
                            address: values.employerAddress,
                            pan: values.employerPan,
                            periodStart: values.period?.[0], // if using RangePicker
                            periodEnd: values.period?.[1],
                            certificateNumber: values.certificateNumber,
                            updatedDate: values.updatedDate,
                            citAddress: values.citAddress,
                            employerRefNo: values.employerRefNo,
                        },

                        quarterSummary: values.quarterSummary.map((q: any) => ({
                            quarter: q.quarter,
                            receiptNumber: q.receiptNumber,
                            amountPaidCredited: Number(q.amountPaidCredited || 0),
                            taxDeducted: Number(q.taxDeducted || 0),
                            taxDeposited: Number(q.taxDeposited || 0),
                        })),

                        bookAdjustments: values.bookAdjustments.map((b: any) => ({
                            serialNo: Number(b.serialNo || 0),
                            taxDeposited: Number(b.taxDeposited || 0),
                            receiptNumber24G: b.receiptNumber24G,
                            ddoSerialNo24G: b.ddoSerialNo24G,
                            transferVoucherDate: b.transferVoucherDate,
                            form24GMatchingStatus: b.form24GMatchingStatus,
                        })),

                        challans: values.challans.map((c: any) => ({
                            serialNo: Number(c.serialNo || 0),
                            taxDeposited: Number(c.taxDeposited || 0),
                            bsrCode: c.bsrCode,
                            taxDepositedDate: c.taxDepositedDate,
                            challanSerialNo: c.challanSerialNo,
                            oltasMatchingStatus: c.oltasMatchingStatus,
                        })),
                    };
                    await CreateForm16AApi(payload);
                }}
                enableReinitialize
            >
                {({ handleSubmit }) => (
                    <FormikForm
                        onSubmit={e => {
                            e.preventDefault();
                            handleSubmit(e);
                        }}
                        className="w-full px-2 sm:px-4"
                    >
                        <Row gutter={[16, 16]} className="mb-4 mt-2 w-full">
                            <Col xs={24}>
                                <Form16Header />
                            </Col>
                            <Col xs={24}>
                                <EmployeeDetailsForm />
                            </Col>
                            <Col xs={24}>
                                <SummaryTable />
                            </Col>
                            <Col xs={24}>
                                <BookAdjustmentSection />
                            </Col>
                            <Col xs={24}>
                                <ChallanDetailsSection />
                            </Col>

                            <Col xs={24}>
                                <Row gutter={[12, 12]} justify="start" className="w-full">
                                    <Col xs={24} sm={12} md={6} lg={4}>
                                    <Button
                                        type="primary"
                                        danger
                                        htmlType="button"
                                        onClick={() => handleSubmit()}
                                        className="w-full"
                                    >
                                        Next
                                    </Button>
                                    </Col>
                                    <Col xs={24} sm={12} md={6} lg={4}>
                                    <Button type="default" danger className="w-full">
                                        Save Draft
                                    </Button>
                                    </Col>
                                </Row>
                                </Col>
                        </Row>
                    </FormikForm>
                )}
            </Formik>
        </Row>
    );
};
export default Form16PartA;
