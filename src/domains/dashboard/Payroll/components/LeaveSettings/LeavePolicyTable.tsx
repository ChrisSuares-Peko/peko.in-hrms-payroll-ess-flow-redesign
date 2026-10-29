import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import LeavePolicyModal from './LeavePolicyModal';
import { useGetAllLeaves } from '../../hooks/leaveSettings/useGetLeaveComponentApi';
import { useLeaveActions } from '../../hooks/leaveSettings/useLeaveComponentApi';
import { filterState } from '../../types/organizationSettings';
import useFilter from '../../utils/general/useFilter';
import { leaveColumns } from '../../utils/orgSettings/data';

const LeavePolicyTable = () => {
    const [openLeaveConfigModal, setOpenLeaveConfigModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<any | null>(null);
    const [reloadTable, setReloadTable] = useState(false);

    const initialValues = {
        searchText: '',
        page: 1,
        limit: 10,
    };

    const [filter, setFilter] = useState<filterState>(initialValues);
    const { handlePageChange, handleSearch } = useFilter({
        setFilter,
    });

    const { data, count, tableLoading } = useGetAllLeaves(
        filter.page,
        filter.limit,
        filter.searchText,
        reloadTable
    );

    const { deleteLeaveAction, isLoading: deleteLoader } = useLeaveActions(() =>
        setOpenConfirmationModal(false)
    );

    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenLeaveConfigModal(true);
    };

    const handleDelete = (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenConfirmationModal(true);
    };

    const handleDeleteLeaveConfig = async () => {
        await deleteLeaveAction(selectedRecordData?.id!);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
    };

    return (
        <Row>
            <Col span={24}>
                <Flex gap={10} justify="space-between" className="flex-col sm:flex-row mb-6">
                    <Col span={24} sm={18} md={20} lg={18} xl={20}>
                        <Input
                            placeholder="Search by name"
                            suffix={<SearchOutlined />}
                            allowClear
                            value={filter.searchText}
                            onChange={e => {
                                const value = e.target.value.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
                                handleSearch({ ...e, target: { ...e.target, value } });
                            }}
                        />
                    </Col>
                    <Col span={24} sm={6} md={4} lg={6} xl={4}>
                        <Flex className="justify-end">
                            <Button
                                className=""
                                type="primary"
                                danger
                                onClick={() => {
                                    setOpenLeaveConfigModal(true);
                                    setSelectedRecordData(null);
                                }}
                            >
                                Add Leave Policies
                            </Button>
                        </Flex>
                    </Col>
                </Flex>
                <Flex vertical>
                    <GenericTable
                        rowKey={record => record.id}
                        columns={leaveColumns(handleEdit, handleDelete)}
                        dataSource={data || []}
                        loading={tableLoading}
                        pagination={false}
                    />
                    <Pagination
                        current={filter.page}
                        onChange={handlePageChange}
                        size="default"
                        className="text-center md:text-end pt-7"
                        total={count}
                    />
                </Flex>
                {openLeaveConfigModal && (
                    <LeavePolicyModal
                        open={openLeaveConfigModal}
                        handleCancel={() => setOpenLeaveConfigModal(false)}
                        selectedRecordData={selectedRecordData}
                        reloadTable={setReloadTable}
                    />
                )}
                <ConfirmationModal
                    isOpen={openConfirmationModal}
                    handleCancel={() => setOpenConfirmationModal(false)}
                    title="Are you sure you want to delete this leave policy?"
                    handleSubmit={handleDeleteLeaveConfig}
                    isLoading={deleteLoader}
                />
            </Col>
        </Row>
    );
};

export default LeavePolicyTable;
