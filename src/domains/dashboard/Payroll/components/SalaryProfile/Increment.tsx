import { useState } from 'react';

import { Button, Col, Flex, Pagination, Row, Select, Table, Typography } from 'antd';
import { useLocation } from 'react-router-dom';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import { useGetEmployeeIncrementApi } from '../../hooks/employeeSalaryHooks/incrementHooks/useGetEmployeeIncrementListingApi';
import { useDeleteIncrementApi } from '../../hooks/employeeSalaryHooks/incrementHooks/useIncrementDeleteApi';
import { filterState } from '../../types/salaryProfileTypes/employeeSalaryTable';
import { incrementTable } from '../../types/salaryProfileTypes/incrementTypes';
import useFilter from '../../utils/general/useFilter';
import { incrementColumn } from '../../utils/increment/data';
import { monthsArray, yearsArray } from '../../utils/salaryTable/data';
import IncrementModal from '../modals/IncrementModal';

const Increment = () => {
    const location = useLocation();
    const [openIncrementModal, setOpenIncrementModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<incrementTable | null>(null);
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
    const { tableDatas, orderCount, tableLoading } = useGetEmployeeIncrementApi(
        eId,
        filter.page,
        filter.limit,
        filter.year,
        filter.month,
        reloadTable
    );

    const { deleteIncrementData, isLoading: deleteLoader } = useDeleteIncrementApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });

    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenIncrementModal(true);
    };
    const openDeleteModal = (selectedRowData: incrementTable) => {
        setSelectedRecordData(selectedRowData);
        setOpenConfirmationModal(true);
    };
    const handleDeleteIncrement = async () => {
        await deleteIncrementData(selectedRecordData?.id!);
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
                            Increment
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
                                    danger
                                    className=""
                                    onClick={() => {
                                        setSelectedRecordData(null);
                                        setOpenIncrementModal(true);
                                    }}
                                >
                                    Add Increment
                                </Button>
                            </Col>
                        </Row>
                    </Flex>
                    <Table
                        className="mt-7"
                        scroll={{ x: 568 }}
                        dataSource={tableDatas}
                        columns={incrementColumn(openDeleteModal, handleEdit)}
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
            {openIncrementModal && (
                <IncrementModal
                    open={openIncrementModal}
                    handleCancel={() => setOpenIncrementModal(false)}
                    employeeIdFromProfile={eId}
                    selectedRecordData={selectedRecordData}
                    reloadTable={setReloadTable}
                    year={filter.year}
                    month={Number(filter.month)}
                />
            )}
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this increment?"
                handleSubmit={handleDeleteIncrement}
                isLoading={deleteLoader}
            />
        </Row>
    );
};
export default Increment;
