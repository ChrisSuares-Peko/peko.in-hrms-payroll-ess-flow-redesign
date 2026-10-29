import { useState } from 'react';

import { Button, Col, Flex, Pagination, Row, Select, Table, Typography } from 'antd';
import { useLocation } from 'react-router-dom';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import { useGetEmployeeReimbursementApi } from '../../hooks/employeeSalaryHooks/ReimbursementHooks/useGetEmployeeReimbursementDetailsApi';
import { useDeleteReimbursementApi } from '../../hooks/employeeSalaryHooks/ReimbursementHooks/useReimbursementDeleteApi';
import { useUpdateReimbursement } from '../../hooks/employeeSalaryHooks/ReimbursementHooks/useUpdateReimbursementApi';
import { filterState } from '../../types/salaryProfileTypes/employeeSalaryTable';
import { reimbursementTableType } from '../../types/salaryProfileTypes/ReimbursementTypes/index';
import useFilter from '../../utils/general/useFilter';
import { reimbursementColumn } from '../../utils/salarySectionOthers/data';
import { monthsArray, yearsArray } from '../../utils/salaryTable/data';
import DocumentPreviewModal from '../modals/DocumentPreviewModal';
import ReimbursementModal from '../modals/ReimbursementModal';

const Reimbursement = () => {
    const location = useLocation();
    const [openReimbursementModal, setOpenReimbursementModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<reimbursementTableType | null>(
        null
    );
    const [reloadTable, setReloadTable] = useState(false);
    const [viewingDoc, setViewingDoc] = useState<string | null>(null);
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

    const { tableDatas, orderCount, tableLoading } = useGetEmployeeReimbursementApi(
        eId,
        filter.page,
        filter.limit,
        filter.year,
        filter.month,

        reloadTable,
        filter.searchText
    );

    const { deleteReimbursementData, isLoading: deleteLoader } = useDeleteReimbursementApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const { updateReimbursementId } = useUpdateReimbursement(() => setReloadTable(p => !p));

    const handleEdit = async (selectedRowData: reimbursementTableType) => {
        setSelectedRecordData(selectedRowData);
        setOpenReimbursementModal(true);
    };

    // supportingDocs is deliberately omitted — approve/reject never touches the
    // receipt, and passing the existing value through here would make the
    // update hook mis-treat it as a fresh base64 upload (see useUpdateReimbursementApi.ts).
    const buildApproveRejectPayload = (record: reimbursementTableType, status: string) => ({
        employeeId: record.employeeId,
        expenseDate: record.expenseDate,
        managerEmail: record.managerEmail,
        expenseDetails: record.expenseDetails,
        totalPay: record.amountPaid,
        paymentStatus: status,
    });
    const handleApprove = (record: reimbursementTableType) =>
        updateReimbursementId(buildApproveRejectPayload(record, 'APPROVED') as any, record);
    const handleReject = (record: reimbursementTableType) =>
        updateReimbursementId(buildApproveRejectPayload(record, 'REJECTED') as any, record);
    const openDeleteModal = (selectedRowData: reimbursementTableType) => {
        setSelectedRecordData(selectedRowData);
        setOpenConfirmationModal(true);
    };
    const handleDeleteReimbursement = async () => {
        await deleteReimbursementData(selectedRecordData?.id!);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
    };
    return (
        <Row>
            <Col span={24}>
                <Flex vertical className="mt-6">
                    <Flex justify="space-between" wrap="wrap">
                        <Typography.Text
                            className="font-normal text-fontSubHeader"
                            style={{ fontSize: '1.246rem' }}
                        >
                            Reimbursement
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

                            <Button
                                onClick={() => {
                                    setSelectedRecordData(null);
                                    setOpenReimbursementModal(true);
                                }}
                                danger
                                className="ms-2"
                            >
                                Add Reimbursement
                            </Button>
                        </Row>
                    </Flex>
                    <Table
                        className="mt-7"
                        scroll={{ x: 568 }}
                        dataSource={tableDatas}
                        columns={reimbursementColumn(openDeleteModal, handleEdit, handleApprove, handleReject, setViewingDoc)}
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
            {openReimbursementModal && (
                <ReimbursementModal
                    open={openReimbursementModal}
                    handleCancel={() => setOpenReimbursementModal(false)}
                    selectedRecordData={selectedRecordData}
                    reloadTable={setReloadTable}
                    employeeIdFromProfile={eId}
                    month={Number(filter.month)}
                    year={filter.year}
                />
            )}
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this reimbursement?"
                handleSubmit={handleDeleteReimbursement}
                isLoading={deleteLoader}
            />
            <DocumentPreviewModal url={viewingDoc} onClose={() => setViewingDoc(null)} />
        </Row>
    );
};
export default Reimbursement;
