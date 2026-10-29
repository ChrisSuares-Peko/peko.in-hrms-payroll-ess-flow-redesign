import { useState } from 'react';

import { Button, Col, Flex, Pagination, Row, Select, Table, Typography } from 'antd';
import { useLocation } from 'react-router-dom';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import { useDeleteDeduction } from '../../hooks/employeeSalaryHooks/DeductionHooks/useDeleteDeductionApi';
import { useGetAllDeduction } from '../../hooks/employeeSalaryHooks/DeductionHooks/useGetAllDeductionApi';
import { deductionTableType } from '../../types/salaryProfileTypes/deductionTypes';
import { filterState } from '../../types/salaryProfileTypes/employeeSalaryTable';
import { deductionColumn } from '../../utils/deductions/data';
import useFilter from '../../utils/general/useFilter';
import { monthsArray, yearsArray } from '../../utils/salaryTable/data';
import DeductionModal from '../modals/DeductionModal';

const Deductions = () => {
    const location = useLocation();
    const [openDeductionModal, setOpenDeductionModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<deductionTableType | null>(null);
    const [reloadTable, setReloadTable] = useState(false);
    const { eId, month, year } = location.state;
    const initialYear = year;
    const initialMonth = month;
    const initialValues = {
        searchText: '',
        sort: 'ASC',
        page: 1,
        limit: 10,
        filter: '',
        year: initialYear,
        month: initialMonth,
    };
    const [filter, setFilter] = useState<filterState>(initialValues);
    const { handlePageChange, handleChangeMonth, handleChangeYear } = useFilter({
        setFilter,
    });
    const { data, count, tableLoading } = useGetAllDeduction(
        eId,
        filter.page,
        filter.limit,
        filter.year,
        filter.month,
        reloadTable
    );
    const { deductionDelete, isLoading: deleteLoader } = useDeleteDeduction({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const handleEdit = async (selectedRowData: deductionTableType) => {
        setSelectedRecordData(selectedRowData);
        setOpenDeductionModal(true);
    };
    const openDeleteModal = (selectedRowData: deductionTableType) => {
        setSelectedRecordData(selectedRowData);
        setOpenConfirmationModal(true);
    };
    const handleDeleteDeduction = async () => {
        await deductionDelete(selectedRecordData?.id!, eId);
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
                            Deduction
                        </Typography.Text>
                        <Row gutter={16} className="justify-between xs:mt-6 md:mt-0">
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
                                    danger
                                    className=""
                                    onClick={() => {
                                        setSelectedRecordData(null);
                                        setOpenDeductionModal(true);
                                    }}
                                >
                                    Add Deductions
                                </Button>
                            </Col>
                        </Row>
                    </Flex>
                    <Table
                        className="mt-7"
                        scroll={{ x: 568 }}
                        dataSource={data}
                        columns={deductionColumn(openDeleteModal, handleEdit)}
                        size="small"
                        pagination={false}
                        loading={tableLoading}
                    />
                    {count! > 0 && (
                        <Pagination
                            current={filter.page}
                            size="default"
                            className="text-end pt-7"
                            total={count}
                            onChange={handlePageChange}
                            pageSize={filter.limit}
                        />
                    )}
                </Flex>
            </Col>
            {openDeductionModal && (
                <DeductionModal
                    open={openDeductionModal}
                    handleCancel={() => setOpenDeductionModal(false)}
                    employeeIdFromProfile={eId}
                    selectedRecordData={selectedRecordData}
                    reloadTable={setReloadTable}
                    month={Number(filter.month)}
                    year={filter.year}
                />
            )}
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this deduction?"
                handleSubmit={handleDeleteDeduction}
                isLoading={deleteLoader}
            />
        </Row>
    );
};
export default Deductions;
