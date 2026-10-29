import { useState } from 'react';

import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row, Select, Table } from 'antd';
// import { useDispatch } from 'react-redux'; // only used by the commented-out Pay Reimbursement button below
import { useLocation } from 'react-router-dom';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
// import { showToast } from '@src/slices/apiSlice'; // only used by the commented-out Pay Reimbursement button below
import { yearsData } from '@utils/yearData';

import { useExportEmployeeReimbursementApi, useGetEmployeeReimbursementApi } from '../../../hooks/employeeSalaryHooks/ReimbursementHooks/useGetEmployeeReimbursementDetailsApi';
import { useDeleteReimbursementApi } from '../../../hooks/employeeSalaryHooks/ReimbursementHooks/useReimbursementDeleteApi';
import { useUpdateReimbursement } from '../../../hooks/employeeSalaryHooks/ReimbursementHooks/useUpdateReimbursementApi';
import { reimbursementTableType } from '../../../types/salaryProfileTypes/ReimbursementTypes';
import useFilter from '../../../utils/general/useFilter';
import { reimbursementColumn } from '../../../utils/salarySectionOthers/data';
import { monthsArray } from '../../../utils/salaryTable/data';
import DocumentPreviewModal from '../../modals/DocumentPreviewModal';
import ReimbursementModal from '../../modals/ReimbursementModal';
// import ReimbursementModal from '../modals/ReimbursementModal';

const Reimbursement = () => {
    const location = useLocation();
    const [openReimbursementModal, setOpenReimbursementModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<reimbursementTableType | null>(
        null
    );
    const [reloadTable, setReloadTable] = useState(false);
    const [viewingDoc, setViewingDoc] = useState<string | null>(null);
    // const dispatch = useDispatch(); // only used by the commented-out Pay Reimbursement button below
    const { employeeId } = location.state;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const initialValues = {
        searchText: '',
        sort: 'ASC',
        page: 1,
        limit: 5,
        filter: '',
        year: currentYear,
        month: currentMonth,
    };
    const [filter, setFilter] = useState<any>(initialValues);
    const { handlePageChange, handleChangeMonth, handleChangeYear } = useFilter({
        setFilter,
    });

    const { tableDatas, orderCount, tableLoading } = useGetEmployeeReimbursementApi(
        employeeId,
        filter.page,
        filter.limit,
        filter.year,
        filter.month,
        reloadTable,
        filter.searchText
    );
    

    const { exportEmployeeReimbursement, isLoading: exportLoader } = useExportEmployeeReimbursementApi(employeeId, filter.year, filter.month, filter.searchText);

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
        const data = await deleteReimbursementData(selectedRecordData?.id!);
        if(data && data.data){
            setSelectedRecordData(null);
        }
        setReloadTable(p => !p);
    };
    let timeout:NodeJS.Timeout
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            setFilter({...filter, searchText: e.target.value});
        }, 500);
    };
    return (
        <Row>
            <Col span={24}>
                <Flex vertical className="mt-6">
                    <Flex justify="space-between" wrap="wrap">
                       


                        <Row  gutter={6} className="justify-between xs:mt-10 md:mt-0 w-full">
                            <Col md={7} xs={24}>
                            <Input
                            placeholder='Search'
                            prefix={<SearchOutlined />}
                            onChange={handleSearch}
                            />
                            </Col>
                            <Col md={3} xs={6}>
                                <Select
                                    options={monthsArray}
                                    className="w-full"
                                    onChange={handleChangeMonth}
                                    defaultValue={currentMonth.toString()}
                                />
                            </Col>
                            <Col md={3} xs={6}>
                                <Select
                                    options={yearsData}
                                    className="w-full"
                                    onChange={handleChangeYear}
                                    defaultValue={currentYear}
                                />
                            </Col>
                               <Col md={3} xs={6}>
                                <Button
                                onClick={() => {
                                        exportEmployeeReimbursement()
                                }}
                                loading={exportLoader}
                                disabled={exportLoader}
                                className="w-full justify-center items-center flex"
                            >
                                <DownloadOutlined />
                                Export
                            </Button>
                            </Col>
                                <Col md={4} xs={6}>
                            <Button
                                onClick={() => {
                                    setSelectedRecordData(null);
                                    setOpenReimbursementModal(true);
                                }}
                                danger
                                className='w-full'
                                >
                                Add Reimbursement
                            </Button>
                                </Col>
                                {/* Pay Reimbursement — commented out for now, not yet implemented.
                                <Col md={4} xs={6}>
                            <Button
                                onClick={() => {
                                   dispatch(showToast({
                                       description: 'Coming Soon',
                                       variant: 'info',
                                   }))
                                }}
                                type='primary'
                                danger
                                className='w-full'
                                >
                                Pay Reimbursement
                            </Button>
                                </Col> */}
                        </Row>
                    </Flex>
                    <Table
                        className="mt-7"
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
                    employeeIdFromProfile={employeeId}
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
