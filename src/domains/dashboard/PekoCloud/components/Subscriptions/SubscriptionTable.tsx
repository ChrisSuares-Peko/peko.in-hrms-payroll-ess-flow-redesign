import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Pagination, Row, Table } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import SubscriptionsDetailsMobileView from './SubscriptionsDetailsMobileView';
import ConfirmationModal from '../../../../../components/molecular/modals/ConfirmationModal';
import { useDeleteSubscriptionApi } from '../../hooks/subscriptionHooks/useDeleteSubscriptionApi';
import { subscriptionColumn } from '../../utils/subscription';
import AssignSoftwareModal from '../Modals/AssignSoftwareModal';
import SubscriptionEmployeesListModal from '../Modals/SubscriptionEmployeesListModal';
import SubscriptionModal from '../Modals/SubscriptionModal';

interface SubscriptionProps {
    reloadInfo: React.Dispatch<React.SetStateAction<boolean>>;
    setReloadTable: React.Dispatch<React.SetStateAction<boolean>>;
    orderCount?: number;
    tableLoading: boolean;
    tableDatas: any;
    handleSearch: any;
    handlePageChange: any;
    page: number;
    limit: number;
}
const SubscriptionTable = ({
    reloadInfo,
    setReloadTable,
    orderCount,
    tableLoading,
    tableDatas,
    handlePageChange,
    handleSearch,
    limit,
    page,
}: SubscriptionProps) => {
    const screen = useScreenSize();
    const [openSubscriptionModal, setOpenSubscriptionModal] = useState(false);
    const [openEmployeesListModal, setOpenEmployeesListModal] = useState(false);
    const [openAssignModal, setOpenAssignModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<any | null>(null);

    const { deleteSubscriptionData, isLoading: deleteLoader } = useDeleteSubscriptionApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const HandleDelete = (selectedRow: any) => {
        setSelectedRecordData(selectedRow);
        setOpenConfirmationModal(true);
    };

    const handleDeleteAsset = async () => {
        await deleteSubscriptionData(selectedRecordData?.id!);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
        reloadInfo(p => !p);
    };
    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenSubscriptionModal(true);
    };
    const handleEmployeesList = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenEmployeesListModal(true);
    };
    return (
        <>
            {screen.xs ? (
                <SubscriptionsDetailsMobileView
                    reloadInfo={reloadInfo}
                    setReloadTable={setReloadTable}
                    handlePageChange={handlePageChange}
                    handleSearch={handleSearch}
                    tableLoading={tableLoading}
                    orderCount={orderCount}
                    tableDatas={tableDatas}
                    page={page}
                    limit={limit}
                />
            ) : (
                <Row>
                    <Col span={24} className="pt-5">
                        <Flex vertical className="">
                            <Row gutter={[15, 16]} className="justify-between xs:mt-10 md:mt-0">
                                <Col span={10} md={12} xl={14} xxl={16}>
                                    <Input
                                        placeholder="Search for subscriptions"
                                        suffix={<SearchOutlined />}
                                        className="rounded-none "
                                        onChange={handleSearch}
                                    />
                                </Col>
                                <Col span={7} md={6} xl={5} xxl={4}>
                                    <Button
                                        onClick={() => {
                                            setSelectedRecordData(null);
                                            setOpenSubscriptionModal(true);
                                        }}
                                        className="test-xs w-full"
                                        style={{
                                            backgroundColor: '#FF4D4F',
                                            color: 'white',
                                        }}
                                        type="primary"
                                        danger
                                    >
                                        Add Subscription
                                    </Button>
                                </Col>
                                <Col span={7} md={6} xl={5} xxl={4}>
                                    <Button
                                        onClick={() => {
                                            setOpenAssignModal(true);
                                        }}
                                        className="test-xs w-full"
                                        type="default"
                                        disabled={!tableDatas.length}
                                        danger
                                    >
                                        Assign Subscription
                                    </Button>
                                </Col>
                            </Row>

                            <Table
                                className="mt-7"
                                scroll={{ x: 568 }}
                                dataSource={tableDatas.map((item: any) => ({
                                    key: item.id,
                                    ...item,
                                }))}
                                columns={subscriptionColumn(
                                    HandleDelete,
                                    handleEdit,
                                    handleEmployeesList
                                )}
                                pagination={false}
                                loading={tableLoading}
                            />

                            <Pagination
                                current={page}
                                size="default"
                                className="text-end pt-7"
                                onChange={handlePageChange}
                                total={orderCount}
                                pageSize={limit}
                            />
                        </Flex>
                    </Col>
                    {openSubscriptionModal && (
                        <SubscriptionModal
                            open={openSubscriptionModal}
                            handleCancel={() => setOpenSubscriptionModal(false)}
                            reloadTable={setReloadTable}
                            selectedRecordData={selectedRecordData}
                            reloadInfo={reloadInfo}
                        />
                    )}
                    {openEmployeesListModal && (
                        <SubscriptionEmployeesListModal
                            open={openEmployeesListModal}
                            handleCancel={() => setOpenEmployeesListModal(false)}
                            selectedRecordData={selectedRecordData}
                        />
                    )}
                    {openAssignModal && (
                        <AssignSoftwareModal
                            open={openAssignModal}
                            handleCancel={() => setOpenAssignModal(false)}
                            reloadTable={setReloadTable}
                        />
                    )}
                    <ConfirmationModal
                        isOpen={openConfirmationModal}
                        handleCancel={() => setOpenConfirmationModal(false)}
                        title="Are you sure you want to delete this software?"
                        handleSubmit={handleDeleteAsset}
                        isLoading={deleteLoader}
                    />
                </Row>
            )}
        </>
    );
};
export default SubscriptionTable;
