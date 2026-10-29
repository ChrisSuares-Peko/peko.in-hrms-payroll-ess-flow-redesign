import { FC, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import {
    Card,
    Col,
    Flex,
    Input,
    Pagination,
    Row,
    Typography,
    Empty,
    Skeleton,
    Button,
    Grid,
} from 'antd';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import SubscriptionDetailsMobileCard from './SubscriptionsDetailsMobileCard';
import { useDeleteSubscriptionApi } from '../../hooks/subscriptionHooks/useDeleteSubscriptionApi';
import AssignSoftwareModal from '../Modals/AssignSoftwareModal';
import SubscriptionEmployeesListModal from '../Modals/SubscriptionEmployeesListModal';
import SubscriptionModal from '../Modals/SubscriptionModal';

interface CompanyDocMobileProps {
    searchText?: string | null;
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

const SubscriptionsDetailsMobileView: FC<CompanyDocMobileProps> = ({
    searchText,
    setReloadTable,
    orderCount,
    tableLoading,
    tableDatas,
    handlePageChange,
    handleSearch,
    limit,
    page,
    reloadInfo,
}) => {
    const screens = Grid.useBreakpoint();
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
    const renderSkeleton = () => <Skeleton active paragraph={{ rows: 3 }} />;

    let tableContent;
    if (tableLoading) {
        tableContent = Array.from({ length: 10 }).map((_, index) => (
            <Card size="small" className="mt-4 h-40 bg-slate-50 border-none p-2" key={index}>
                <Flex className="w-full" gap={5} vertical>
                    {renderSkeleton()}
                </Flex>
            </Card>
        ));
    } else if (tableDatas.length === 0) {
        tableContent = <Empty description="No data available" />;
    } else {
        tableContent = tableDatas.map((item: any, index: number) => (
            <SubscriptionDetailsMobileCard
                key={index}
                item={item}
                handleEdit={handleEdit}
                handleDelete={HandleDelete}
                handleEmployeesList={handleEmployeesList}
            />
        ));
    }

    return (
        <Flex vertical gap={20} className="">
            <Row justify="space-between" align="middle" gutter={[20, 20]}>
                <Col xs={12} sm={12} md={6} className="text-right">
                    <Button
                        onClick={() => {
                            setSelectedRecordData(null);
                            setOpenSubscriptionModal(true);
                        }}
                        className="text-xs sm:text-normal w-full"
                        type="primary"
                        danger
                    >
                        Add Subscription
                    </Button>
                </Col>
                <Col xs={12} sm={12} md={6} className="text-right">
                    <Button
                        onClick={() => {
                            setOpenAssignModal(true);
                        }}
                        className="text-xs sm:text-normal w-full"
                        type="default"
                        disabled={!tableDatas.length}
                        danger
                    >
                        Assign {!screens.xs && 'Subscription'}
                    </Button>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Input
                        placeholder="Search for subscriptions"
                        suffix={<SearchOutlined />}
                        allowClear
                        type="text"
                        maxLength={100}
                        onChange={handleSearch}
                    />
                </Col>
            </Row>
            <Row align="middle" className="p-5 rounded-md bg-bgLightGray">
                <Col xs={12}>
                    {' '}
                    <Flex justify="start">
                        <Typography.Text className="text-[#475467] font-medium">
                            Subscription Name
                        </Typography.Text>
                    </Flex>
                </Col>

                <Col xs={12}>
                    {' '}
                    <Flex justify="center">
                        {' '}
                        <Typography.Text className="text-[#475467] font-medium">
                            Status
                        </Typography.Text>
                    </Flex>
                </Col>
            </Row>
            {tableContent}
            <Pagination
                onChange={handlePageChange}
                size="small"
                className="text-center mt-10"
                total={orderCount}
            />
            {openSubscriptionModal && (
                <SubscriptionModal
                    open={openSubscriptionModal}
                    handleCancel={() => setOpenSubscriptionModal(false)}
                    reloadTable={setReloadTable}
                    selectedRecordData={selectedRecordData}
                    reloadInfo={reloadInfo}
                />
            )}
            {openAssignModal && (
                <AssignSoftwareModal
                    open={openAssignModal}
                    handleCancel={() => setOpenAssignModal(false)}
                    reloadTable={setReloadTable}
                />
            )}
            {openEmployeesListModal && (
                <SubscriptionEmployeesListModal
                    open={openEmployeesListModal}
                    handleCancel={() => setOpenEmployeesListModal(false)}
                    selectedRecordData={selectedRecordData}
                />
            )}
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this subscription?"
                handleSubmit={handleDeleteAsset}
                isLoading={deleteLoader}
            />
        </Flex>
    );
};

export default SubscriptionsDetailsMobileView;
