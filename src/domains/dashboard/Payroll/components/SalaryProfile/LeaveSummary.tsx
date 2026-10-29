import { useState } from 'react';

import { Button, Col, Divider, Flex, Pagination, Row, Select, Table, Typography } from 'antd';
import { useLocation } from 'react-router-dom';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import { LeaveSummaryDetails } from './LeaveSummaryDetails';
import { useGetEmployeeLeaveApi } from '../../hooks/leaveHooks/useGetEmployeeLeaveDetailsApi';
import { useGetTakenLeaveApi } from '../../hooks/leaveHooks/useGetTakenLeaveApi';
import { useDeleteLeaveApi } from '../../hooks/leaveHooks/useLeaveDeleteApi';
import { LeaveTableRow } from '../../types/leaveSection';
import { filterState } from '../../types/salaryProfileTypes/employeeSalaryTable';
import useFilter from '../../utils/general/useFilter';
import { leaveListColumn } from '../../utils/leave/data';
import { monthsArray, yearsArray } from '../../utils/salaryTable/data';
import LeaveModal from '../Leaves/LeaveModal';

const SalaryProfile = () => {
    const location = useLocation();
    const [openLeaveModal, setOpenLeaveModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<LeaveTableRow | null>(null);
    const [reloadTable, setReloadTable] = useState(false);
    const { eId, month, year } = location.state;
    const initialYear = year;
    const initialMonth = month;
    const initialValues = {
        searchText: '',
        sort: 'ASC',
        page: 1,
        limit: 5,
        filter: '',
        year: initialYear,
        month: initialMonth,
    };
    const [filter, setFilter] = useState<filterState>(initialValues);
    const { handlePageChange, handleChangeMonth, handleChangeYear } = useFilter({
        setFilter,
    });
    const { takenLeaveDetails } = useGetTakenLeaveApi(eId, reloadTable);
    const { tableDatas, orderCount, tableLoading } = useGetEmployeeLeaveApi(
        eId,
        filter.page,
        filter.limit,
        filter.year,
        filter.month,
        reloadTable
    );
    const { deleteLeaveData, isLoading: deleteLoader } = useDeleteLeaveApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });

    const handleEdit = async (selectedRowData: LeaveTableRow) => {
        setSelectedRecordData(selectedRowData);
        setOpenLeaveModal(true);
    };

    const openDeleteModal = (selectedRowData: LeaveTableRow) => {
        setSelectedRecordData(selectedRowData);
        setOpenConfirmationModal(true);
    };

    const handleDeleteLeave = async () => {
        const res = await deleteLeaveData(selectedRecordData?.id!);
        if (res) {
            setSelectedRecordData(null);
            setReloadTable(p => !p);
        }
    };
    return (
        <Row className="mt-6 h-[75vh]">
            <Col xs={24} md={6} className=" ">
                <Flex className="" vertical>
                    <Typography.Text
                        className="font-normal text-fontSubHeader"
                        style={{ fontSize: '1.246rem' }}
                    >
                        Leave Taken Summary
                    </Typography.Text>

                    <Flex className="my-6 mt-6 " vertical>
                        {takenLeaveDetails?.map((item, index) => (
                            <LeaveSummaryDetails
                                key={index}
                                title={item.title}
                                icon={item.icon}
                                value={item.value}
                            />
                        ))}
                    </Flex>
                </Flex>
            </Col>
            <Col className="xs:hidden md:block" xs={0} md={1}>
                <Divider type="vertical" className="h-full" />
            </Col>
            <Col xs={24} md={16} className="mx-2">
                <Flex vertical gap="middle" className="">
                    <Flex justify="space-between">
                        <Typography.Text
                            className="font-normal text-fontSubHeader"
                            style={{ fontSize: '1.246rem' }}
                        >
                            List of Leaves Taken
                        </Typography.Text>
                        <Row gutter={16} className="justify-between xs:mt-10 md:mt-0">
                            <Col className="md:w-40">
                                <Select
                                    options={monthsArray}
                                    className="w-full"
                                    onChange={handleChangeMonth}
                                    defaultValue={initialMonth.toString()}
                                />
                            </Col>
                            <Col className="md:w-40">
                                <Select
                                    options={yearsArray}
                                    className="w-full"
                                    onChange={handleChangeYear}
                                    defaultValue={initialYear}
                                />
                            </Col>
                            <Col className="p-0 m-0">
                                <Button
                                    onClick={() => {
                                        setSelectedRecordData(null);
                                        setOpenLeaveModal(true);
                                    }}
                                    danger
                                >
                                    Add Leave
                                </Button>
                            </Col>
                        </Row>
                    </Flex>
                    <Table
                        className="mt-6"
                        scroll={{ x: 568 }}
                        dataSource={tableDatas}
                        columns={leaveListColumn(openDeleteModal, handleEdit)}
                        size="small"
                        pagination={false}
                        loading={tableLoading}
                    />
                    {orderCount! > 0 && (
                        <Pagination
                            current={filter.page}
                            size="default"
                            className="text-end pt-7"
                            total={orderCount}
                            onChange={handlePageChange}
                            pageSize={filter.limit}
                        />
                    )}
                </Flex>
            </Col>

            {openLeaveModal && (
                <LeaveModal
                    open={openLeaveModal}
                    handleCancel={() => setOpenLeaveModal(false)}
                    selectedRecordData={selectedRecordData}
                    reloadTable={setReloadTable}
                    employeeIdFromProfile={eId}
                />
            )}
            {openConfirmationModal && (
                <ConfirmationModal
                    isOpen={openConfirmationModal}
                    handleCancel={() => setOpenConfirmationModal(false)}
                    title="Are you sure you want to delete this Leave?"
                    handleSubmit={handleDeleteLeave}
                    isLoading={deleteLoader}
                />
            )}
        </Row>
    );
};

export default SalaryProfile;
