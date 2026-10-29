import React, { useEffect, useState } from 'react';

import { Button, Col, Form, Row, Tabs } from 'antd';
import { Formik } from 'formik';
import { useLocation, useNavigate } from 'react-router-dom';

import SelectInput from '@components/atomic/inputs/SelectInput';

import Form16PartA from './Form16PartA';
import Form16PartB from './Form16PartB';
import { useGetEmployee } from '../../hooks/dashboardHooks/useGetEmployeeApi';
// import { taxRegimeOptions } from '../../utils/general/data';
import DownloadForm16 from '../../hooks/reports/useDownloadForm16';
import useForm16AApi from '../../hooks/reports/useForm16AApi';
import useForm16BApi from '../../hooks/reports/useForm16BApi';
import { yearOptions } from '../../utils/general/data';

const Form16Tab = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [form16ActiveTabKey, setForm16ActiveTabKey] = useState('1');
    // const {employeeList,employees} = useForm16AApi();
    const { getForm16A, employeesPartA } = useForm16AApi();
    const { getForm16B, employeesPartB } = useForm16BApi();
    const {getForm16} = DownloadForm16();
    const { data, generateEmployeesDropdown } = useGetEmployee();
    const [selectedEmployee, setSelectedEmployee] = useState<any>();
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedEmpId, setSelectedEmpId] = useState('');

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const activeTabForm16 = queryParams.get('activeTabForm16');

        if (activeTabForm16) {
            setForm16ActiveTabKey(activeTabForm16);
        }
    }, [location]);

    //   useEffect( () => {
    //         const employeeListCall = async () => {
    //         if (selectedEmployee && selectedYear) {
    //             console.log("Both selected:", { employee: selectedEmployee, year: selectedYear });
    //             const employeeId= selectedEmployee?.id;
    //             await employeeList(employeeId, selectedYear);

    //         }
    //     }
    //     employeeListCall();
    //     }, [employeeList, selectedEmployee, selectedYear]);
    useEffect(() => {
        const callApi = async () => {
            if (!selectedEmployee || !selectedYear) return;

            const employeeId = selectedEmployee?.id;

            // 🔹 Part A API
            if (form16ActiveTabKey === '1') {
                await getForm16A(employeeId, selectedYear);
            }

            // 🔹 Part B API
            if (form16ActiveTabKey === '2') {
                await getForm16B(employeeId, selectedYear);
            }
        };

        const hasInnerTab = location.search.includes('activeTabForm16');

        // CASE 1: URL = ?activeTab=4 → dropdown selected should call API (default = Part A)
        if (!hasInnerTab) {
            if (selectedEmployee && selectedYear) {
                getForm16A(selectedEmployee.id, selectedYear);
            }
            return;
        }

        // CASE 2: URL contains activeTabForm16 → call based on tab
        callApi();
    }, [
        form16ActiveTabKey,
        selectedEmployee,
        selectedYear,
        location.search,
        getForm16A,
        getForm16B,
    ]);

    const items = [
        {
            key: '1',
            label: 'Part A',
            children: (
                <Form16PartA
                    employee={employeesPartA}
                    selectedEmpId={selectedEmpId}
                    selectedYear={selectedYear}
                    selectedEmployee={selectedEmployee}
                />
            ),
        },
        {
            key: '2',
            label: 'Part B',
            children: (
                <Form16PartB
                    employee={employeesPartB}
                    selectedEmpId={selectedEmpId}
                    selectedYear={selectedYear}
                    selectedEmployee={selectedEmployee}
                />
            ), // Replace with actual component if needed
        },
    ];
    const onChange = (key: string) => {
        setForm16ActiveTabKey(key);
        navigate(`?activeTabForm16=${key}`);
    };
    return (
        <Row>
            <Formik
                initialValues={{
                    address: '',
                }}
                onSubmit={(values, { setSubmitting }) => {
                    setSubmitting(false);
                }}
            >
                {({ handleSubmit, setFieldValue }) => (
                    <Form layout="vertical" onFinish={handleSubmit} className="w-full">
                        <Row gutter={[16, 16]} className="mb-4 mt-2">
                            <Col xs={24} md={8}>
                                <SelectInput
                                    name="assessmentYear"
                                    options={yearOptions || []}
                                    label="Assessment Year"
                                    classes="w-full"
                                    formItemClass="w-full"
                                    placeholder="Select the Assessment year"
                                    handleChange={e => {
                                        setFieldValue('assessmentYear', e);
                                        setSelectedYear(e);
                                    }}
                                />
                            </Col>
                            <Col xs={24} md={8} className="">
                                <SelectInput
                                    name="employee"
                                    options={generateEmployeesDropdown(data) || []}
                                    label="Select Employee"
                                    placeholder="Select the Employee"
                                    handleChange={e => {
                                        setFieldValue('employee', e);
                                        setSelectedEmpId(e);
                                        // Find the selected employee from data array
                                        const selected = data?.find((emp: any) => emp.id === e);
                                        setSelectedEmployee(selected || null);
                                    }}
                                />
                            </Col>

                            <Col md={8} xs={24} className="mt-7">
                                <Button disabled={ !selectedEmployee?.id && !selectedYear} type="default" danger onClick={async()=>{
                                     await getForm16(selectedEmployee?.id,selectedYear,form16ActiveTabKey==="1" ? "form16a" : "form16b")
                                     }}>
                                    Download
                                </Button>
                            </Col>
                        </Row>
                        <Tabs
                            defaultActiveKey="5"
                            activeKey={form16ActiveTabKey}
                            items={items}
                            onChange={onChange}
                            className="flex w-full ml-2"
                        />
                    </Form>
                )}
            </Formik>
        </Row>
    );
};
export default Form16Tab;
