import { useEffect, useState } from 'react';

import { Col, Row, Typography, Table, Button, Pagination, Tooltip } from 'antd';
import type { TableColumnsType, TableProps } from 'antd';
import moment from 'moment';
import '../../assets/styles.css';

import { useAppSelector } from '@src/hooks/store';
import { formatNumberWithLocalStringWithoutDecimalPoint } from '@utils/priceFormat';

import { EmployeeDisplayType } from '../../types/employeeOnboarding';
import BulkUploadCreateModal from '../modals/BulkUploadCreateModal';

type InitialStateDataType = {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    mobileNo: string;
    email: string;
    state: string | null;
    addressLine1: string;
    addressLine2: string;
    pinCode: string;
    emergencyContactNumber: string | null;
    emergencyContactName: string | null;
    emergencyContactRelation: string | null;
    employeeId: string;
    department: string;
    workingHours: number;
    dateOfJoin: string;
    designation: string;
    workEmailId: string;
    workingDays: string;
    contractType: string;
    reportingStaff: string | null;
    timeSchedule: string;
    employeeStatus: string;
    probationPeriod: string | null;
    pan?: string | null;
    taxRegime?: string | null;
    uan?: string | null;
    esiNumber?: string | null;
    workState?: string | null;
    annualCTC?: number | string | null;
    accountHolderName?: string | null;
    accountNumber?: string | null;
    bankName?: string | null;
    ifscCode?: string | null;
    validated: boolean;
    errors: string[];
    corporateUser?: string;
};
const BulkEmployeesTable = ({ onCountChange }: any) => {
    const jsonData = useAppSelector(state => state.reducer.BulkUpload);
    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        const errorCount = jsonData.filter(item => item.errors.length > 0).length;

        const successCount = jsonData.filter(item => item.errors.length === 0).length;
        onCountChange(jsonData.length, errorCount, successCount);
    }, [jsonData, onCountChange]);

    // `id` must be unique per row for the Table's rowKey — an uploaded Excel's own
    // Employee ID column is exactly what's being validated here, so it can (and does, per
    // real error rows) arrive blank or duplicated across rows. Using it as the row key let
    // two different rows collide on the same React key, which is what caused the ghost
    // duplicate-row rendering when paging back and forth. The row's own stable position in
    // jsonData is unique regardless of how messy the uploaded data is.
    const employeeTypeData: EmployeeDisplayType[] = jsonData.map((item, index) => ({
        id: String(index),
        fullName: item.fullName,
        errors: item.errors,
        status: item.validated,
        joinDate: item.dateOfJoin,
        role: item.designation,
        department: item.department,
        annualCTC: item.annualCTC ?? null,
        employeeId: item.employeeId,
    }));

    const paginatedEmployeeTypeData = employeeTypeData.slice(
        (current - 1) * pageSize,
        current * pageSize
    );

    const [isModalVisible, setIsModalVisible] = useState(false);
    // const [selectedEmployee, setSelectedEmployee] = useState<InitialStateDataType | undefined>(
    //     undefined
    // );
    const [selectedEmployeeInfo, setSelectedEmployeeInfo] = useState<{
        data: InitialStateDataType | undefined;
        index: number;
    }>();
    const handleClick = (id: string) => {
        // `id` is now the row's own index in jsonData (see employeeTypeData above) — a
        // direct lookup by employeeId here previously always resolved to the FIRST row
        // sharing that Employee ID, making every duplicate/blank-ID row after it
        // uneditable.
        const index = Number(id);
        const employee = jsonData[index];
        if (employee) {
            setIsModalVisible(true);
            // setSelectedEmployee(employee);
            setSelectedEmployeeInfo({ data: employee, index });
            // You can do something with the employee data here
        }
        setIsModalVisible(true);
    };

    const columns: TableColumnsType<EmployeeDisplayType> = [
        {
            title: '#',
            key: 'serial',
            render: (text, record, index) => (current - 1) * pageSize + index + 1,
        },
        {
            title: 'Employee ID',
            dataIndex: 'employeeId',
            render: (employeeId: string) => <Typography.Text>{employeeId}</Typography.Text>,
        },
        {
            title: 'Full Name',
            dataIndex: 'fullName',

            render: (fullName: string) => <Typography.Text>{fullName}</Typography.Text>,
        },
        {
            title: 'Designation',
            dataIndex: 'role',
            render: (role: string) => <Typography.Text>{role}</Typography.Text>,
        },
        {
            title: 'Department',
            dataIndex: 'department',
            render: (department: string) => <Typography.Text>{department}</Typography.Text>,
        },
        {
            title: 'Date of Join',
            dataIndex: 'joinDate',
            render: (joinDate: string) => (
                <Typography.Text>{moment(joinDate).format('MMM DD, YYYY')}</Typography.Text>
            ),
        },
        {
            title: 'Annual CTC',
            dataIndex: 'annualCTC',
            render: (annualCTC: number | string | null) =>
                annualCTC != null && annualCTC !== '' ? (
                    <Typography.Text>{`₹ ${formatNumberWithLocalStringWithoutDecimalPoint(Number(annualCTC))}`}</Typography.Text>
                ) : (
                    <Typography.Text>-</Typography.Text>
                ),
        },
        {
            title: 'Status',
            dataIndex: 'errors',
            render: (errors: string[]) =>
                errors.length === 0 ? (
                    <Typography.Text style={{ color: 'green' }}>Success</Typography.Text>
                ) : (
                    <Tooltip
                        title={
                            <ul style={{ margin: 0, paddingLeft: 16 }}>
                                {errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        }
                    >
                        <Typography.Text style={{ color: 'red', cursor: 'pointer' }}>
                            {`Error (${errors.length})`}
                        </Typography.Text>
                    </Tooltip>
                ),
        },
        {
            title: 'Actions',
            dataIndex: 'id',
            width: '10%',
            render: (id: string) => (
                <Button type="link" onClick={() => handleClick(id)} style={{ color: 'red' }}>
                    View and Edit
                </Button>
            ),
        },
    ];

    const handleTableChange: TableProps<EmployeeDisplayType>['onChange'] = (
        pagination,
        filters,
        sorter,
        extra
    ) => {
        if (pagination.current) setCurrent(pagination.current);
        if (pagination.pageSize) setPageSize(pagination.pageSize);
    };
    // const titleStyle = {
    //     backgroundColor: '#42526D',
    //     color: 'white',
    // };

    return (
        <>
            <Row className="mt-4" gutter={[0, 20]}>
                <Col span={24}>
                    <Table
                        rowKey={record => record.id}
                        columns={columns}
                        scroll={{ x: 992 }}
                        dataSource={paginatedEmployeeTypeData}
                        onChange={handleTableChange}
                        pagination={false}
                    />
                </Col>
                <Col span={24}>
                    <div className="flex xs:justify-center md:justify-end xs:mt-4">
                        <Pagination
                            current={current}
                            pageSize={pageSize}
                            total={jsonData.length}
                            showSizeChanger={false}
                            onChange={(page, size) => {
                                setCurrent(page);
                                setPageSize(size);
                            }}
                        />
                    </div>
                </Col>
            </Row>
            {isModalVisible && (
                <BulkUploadCreateModal
                    open={isModalVisible}
                    handleCancel={() => setIsModalVisible(false)}
                    // employeeData={selectedEmployee} // Pass the selected employee data as a prop
                    employeeData={selectedEmployeeInfo?.data}
                    employeeIndex={selectedEmployeeInfo?.index}
                    batchSize={jsonData.length}
                />
            )}
        </>
    );
};

export default BulkEmployeesTable;
