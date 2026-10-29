import React, { useState } from 'react';

import { DeleteOutlined, EditOutlined, SearchOutlined,DownloadOutlined } from '@ant-design/icons';
import {
    Button,
    Col,
    Input,
    Pagination,
    Row,
    Select,
    Space,
    TableColumnsType,
    Typography,
} from 'antd';
import { Link } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import useDebounce from '@src/hooks/useDebounce';

import LeaveModal from './LeaveModal';
import useLeaveFilter from '../../hooks/dashboardHooks/useLeaveFilter';
import useExportLeaveSummaryApi from '../../hooks/leaveHooks/useExportLeaveSummaryApi';
import { useDeleteLeaveApi } from '../../hooks/leaveHooks/useLeaveDeleteApi';
// import { formatLeaveTypeString } from '../../hooks/leaveHooks/useLeaveListApi';
import { useAllEmployeeLeaveListingApi } from '../../hooks/leavesAndAttendanceHooks/useAllEmployeeLeaveListingApi';
import { LeaveTableRow } from '../../types/leaveSection';
import { filterStates } from '../../types/types';
// import { dummyData } from '../../utils/leave/data';
import { monthsArray, yearsCurrentAndNext } from '../../utils/salaryTable/data';

interface LeavesTableProps {
    reloadTable: boolean;
    setReloadTable: React.Dispatch<React.SetStateAction<boolean>>;
    month: number;
    year: number;
    handleChangeMonths: (value: number) => void;
    handleChangeYears: (value: number) => void;
}

const LeavesTable = ({
    reloadTable,
    setReloadTable,
    month,
    year,
    handleChangeMonths,
    handleChangeYears,
}: LeavesTableProps) => {
    const initialMonth = new Date().getMonth() + 1;
    const initialYear = new Date().getFullYear();

    const [openLeaveApplicationModal, setOpenLeaveApplicationModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<LeaveTableRow | null>(null);
    const { getLeaveSummary } = useExportLeaveSummaryApi();
    const [filter, setFilter] = useState<filterStates>({
        search: '',
        start: 0,
        length: 10,
        year: initialYear,
        month: initialMonth,
    });
    const { handleSearch, handlePageChange, handleChangeMonth, handleChangeYear } = useLeaveFilter({
        setFilter,
    });
    const debouncedSearch = useDebounce(filter.search, 500);

    const { isLoading, data, count, employeeLeaves } = useAllEmployeeLeaveListingApi(
        filter.start,
        filter.length,
        // filter.search,
        debouncedSearch,
        filter.year,
        filter.month,
        reloadTable
    );

    console.log('daata!', data);

    const { deleteLeaveData, isLoading: deleteLoader } = useDeleteLeaveApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const handleExport = async () => {
        try {
            getLeaveSummary(filter.month, filter.year, filter.search);
        } catch (error) {
            console.error('Error exporting data: ', error);
        }
    };
    const handleEdit = async (selectedRowData: LeaveTableRow) => {
        setSelectedRecordData(selectedRowData);
        setOpenLeaveApplicationModal(true);
    };

    const handleDelete = (selectedRowData: LeaveTableRow) => {
        setSelectedRecordData(selectedRowData);
        setOpenConfirmationModal(true);
    };

    const handleDeleteLeave = async () => {
        const res = await deleteLeaveData(selectedRecordData?.id!);
        if (res) {
            setSelectedRecordData(null);
            employeeLeaves();
        }
    };

    const employeeLeaveTable: TableColumnsType<any> = [
        {
            title: 'Name',
            dataIndex: 'employeeName',
            render: (employeeName: string, record: LeaveTableRow) => (
                <Link to={`/payroll/employee-Leaves/leave-summary/${record.employeeId}`}>
                    <Typography.Text>{employeeName}</Typography.Text>
                </Link>
            ),
        },
        {
            title: 'Employee ID',
            dataIndex: 'employeeInformation_employeeId',
            render: (employeeId: string, record: LeaveTableRow) => (
                <Link to={`/payroll/employee-Leaves/leave-summary/${record.employeeId}`}>
                    <Typography.Text>{employeeId}</Typography.Text>
                </Link>
            ),
        },
        {
            title: 'Leave Type',
            dataIndex: 'leaveType',
            render: (leaveTypeObj: any,record: LeaveTableRow) => (leaveTypeObj?.leaveType ?? '') + (record.totalDays === 0.5 ? `(${record?.halfDaySelection?.split('_')?.join(' ')})` : '') || '-',
        },
        {
            title: 'Start date',
            dataIndex: 'from',
            render: (date: string) => date, // directly display the ISO date string (e.g., "2025-06-01")
        },

        {
            title: 'End date',
            dataIndex: 'to',
            render: (date: string) => date,
        },
        {
            title: 'Leaves Taken',
            dataIndex: 'totalDays',
            key: 'totalDays',
        },
        {
            title: 'Leave Balance',
            dataIndex: 'leaveBalance',
            key: 'leaveBalance',
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            width: '5%',
            render: (text, record: LeaveTableRow) => (
                <Space size="middle">
                    <Button className="border-0" onClick={() => handleDelete(record)}>
                        <DeleteOutlined className="text-[#E30000]" />
                    </Button>
                    <Button className="border-0" onClick={() => handleEdit(record)}>
                        <EditOutlined className="text-[#E30000]" />
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <Row>
            <Row justify="space-between" gutter={[16, 16]} className="mb-3 w-full">
                <Col md={15} xs={24} sm={24} className="">
                    <Input
                        placeholder="Search by name,leave type or ID"
                        suffix={<SearchOutlined />}
                        allowClear
                        value={filter.search}
                        onChange={e => {
                            const value = e.target.value.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
                            handleSearch({ ...e, target: { ...e.target, value } });
                        }}
                    />
                </Col>
                <Col xs={12} md={3}>
                    <Select
                        options={monthsArray}
                        className="w-full"
                        // onChange={handleChangeMonth}
                        onChange={value => {
                            handleChangeMonth(value);
                            const val = Number(value);
                            handleChangeMonths(val);
                        }}
                        defaultValue={initialMonth.toString()}
                    />
                </Col>
                <Col xs={12} md={3}>
                    <Select
                        options={yearsCurrentAndNext}
                        className="w-full"
                        // onChange={handleChangeYear}
                        onChange={value => {
                            handleChangeYear(value);
                            handleChangeYears(value);
                        }}
                        defaultValue={initialYear}
                    />
                </Col>
                <Col xs={12} md={3}>
                    <Button onClick={handleExport} className='w-full flex justify-center items-center'><DownloadOutlined/>Export</Button>
                </Col>
                <Col md={24} xs={24}>
                    <GenericTable
                        columns={employeeLeaveTable}
                        dataSource={data}
                        loading={isLoading}
                        pagination={false}
                        rowKey="id"
                    />
                </Col>
                <Col md={24} xs={24} style={{ justifyContent: 'flex-end',display:"flex" }}>
                    {!isLoading && (
                        <Pagination
                            current={filter.start}
                            onChange={handlePageChange}
                            size="default"
                            total={count}
                            className="pt-7"
                        />
                    )}
                </Col>
            </Row>

            {openLeaveApplicationModal && (
                <LeaveModal
                    open={openLeaveApplicationModal}
                    handleCancel={() => setOpenLeaveApplicationModal(false)}
                    selectedRecordData={selectedRecordData}
                    reloadTable={setReloadTable}
                    month={filter.month}
                    year={filter.year}
                />
            )}
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this leave?"
                handleSubmit={handleDeleteLeave}
                isLoading={deleteLoader}
            />
        </Row>
    );
};

export default LeavesTable;
