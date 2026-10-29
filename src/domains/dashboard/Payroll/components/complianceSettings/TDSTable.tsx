import React, { useState } from 'react';

import { DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row, Space, Table, TableColumnsType } from 'antd';

import BulkUploadModal from '@components/molecular/modals/BulkUploadModal';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import useDebounce from '@src/hooks/useDebounce';

import TDSModal from './TDSModal';
import useLeaveFilter from '../../hooks/dashboardHooks/useLeaveFilter';
import { useDeleteLeaveApi } from '../../hooks/leaveHooks/useLeaveDeleteApi';
import { useListLeave } from '../../hooks/leaveHooks/useLeaveListApi';
import { LeaveTableRow } from '../../types/leaveSection';
import { filterStates } from '../../types/types';

// interface TDSTableProps {}

const TDSTable = () => {
    const initialMonth = new Date().getMonth() + 1;
    const initialYear = new Date().getFullYear();

    const [openTDSModal, setOpenTDSModal] = useState(false);
    const [openBulkUploadModal, setOpenBulkUploadModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<LeaveTableRow | null>(null);

    const [filter, setFilter] = useState<filterStates>({
        search: '',
        start: 0,
        length: 10,
        year: initialYear,
        month: initialMonth,
    });
    const { handleSearch, handlePageChange } = useLeaveFilter({
        setFilter,
    });
    const debouncedSearch = useDebounce(filter.search, 500);

    const { isLoading, count, employeeLeaves } = useListLeave(
        filter.start,
        filter.length,
        // filter.search,
        debouncedSearch,
        filter.year,
        filter.month
    );

    const { deleteLeaveData, isLoading: deleteLoader } = useDeleteLeaveApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });

    const handleEdit = async (selectedRowData: LeaveTableRow) => {
        setSelectedRecordData(selectedRowData);
        setOpenTDSModal(true);
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
            title: 'Employee Name',
            dataIndex: 'employeeName',
        },
        {
            title: 'Month',
            dataIndex: 'month',
        },
        {
            title: 'Year',
            dataIndex: 'year',
        },
        {
            title: 'TDS Amount(₹)',
            dataIndex: 'tdsAmount',
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
            <Col span={24}>
                <Flex justify="space-between">
                    <Col md={17} className="mb-6">
                        <Input
                            placeholder="Search by name"
                            suffix={<SearchOutlined />}
                            allowClear
                            value={filter.search}
                            onChange={e => {
                                const value = e.target.value.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
                                handleSearch({ ...e, target: { ...e.target, value } });
                            }}
                        />
                    </Col>
                    <Col>
                        <Flex className="justify-end w-full ">
                            <Button danger onClick={() => setOpenBulkUploadModal(true)}>
                                Import TDS Info
                            </Button>
                        </Flex>
                    </Col>
                    <Col>
                        <Flex className="justify-end w-full ">
                            <Button
                                className=""
                                type="primary"
                                danger
                                onClick={() => setOpenTDSModal(true)}
                            >
                                Add New Component
                            </Button>
                        </Flex>
                    </Col>
                </Flex>
                <Table
                    columns={employeeLeaveTable}
                    dataSource={[]}
                    loading={isLoading}
                    pagination={false}
                />
                <Pagination
                    current={filter.start}
                    onChange={handlePageChange}
                    size="default"
                    className="text-end pt-7"
                    total={count}
                />
                {openTDSModal && (
                    <TDSModal
                        open={openTDSModal}
                        handleCancel={() => setOpenTDSModal(false)}
                        selectedRecordData={selectedRecordData}
                        month={filter.month}
                        year={filter.year}
                    />
                )}
                {openBulkUploadModal && (
                    <BulkUploadModal
                        open={openBulkUploadModal}
                        handleCancel={() => setOpenBulkUploadModal(false)}
                        handleBulkUpload={() => {}}
                    />
                )}
                <ConfirmationModal
                    isOpen={openConfirmationModal}
                    handleCancel={() => setOpenConfirmationModal(false)}
                    title="Are you sure you want to delete this TDS Component?"
                    handleSubmit={handleDeleteLeave}
                    isLoading={deleteLoader}
                />
            </Col>
        </Row>
    );
};

export default TDSTable;
