import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row, Table } from 'antd';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import LeavePolicyModal from './tabs/LeavePolicyModal';
import { useEmployeeLeaveApi } from '../../hooks/employeeProfileHooks/useEmployeeLeaveApi';
import { useLeaveActions } from '../../hooks/leaveSettings/useLeaveComponentApi';
import { filterState } from '../../types/organizationSettings';
import useFilter from '../../utils/general/useFilter';
import { leaveColumns } from '../../utils/orgSettings/data';

type LeavePolicyTableProps = {
    employeeId: string;
};
const LeavePolicyTable: React.FC<LeavePolicyTableProps> = ({ employeeId }) => {
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

    const { data, count, tableLoading } = useEmployeeLeaveApi(
        filter.page,
        filter.limit,
        filter.searchText,
        employeeId,
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
                <Flex justify="space-between">
                    <Col md={20} className="mb-6">
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
                    <Col>
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
                                Add Leave Policy
                            </Button>
                        </Flex>
                    </Col>
                </Flex>
                <Table
                    columns={leaveColumns(handleEdit, handleDelete)}
                    dataSource={data || []}
                    loading={tableLoading}
                    pagination={false}
                />
                <Pagination
                    current={filter.page}
                    onChange={handlePageChange}
                    size="default"
                    className="text-end pt-7"
                    total={count}
                />
                {openLeaveConfigModal && (
                    <LeavePolicyModal
                        employeeId={employeeId}
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
