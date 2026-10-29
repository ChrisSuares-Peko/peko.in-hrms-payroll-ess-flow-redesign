import { useMemo, useState } from 'react';

import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Pagination, Row, Select, Space, Tag, Typography } from 'antd';
import { useLocation } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { useDeleteBonusApi } from '../../hooks/employeeSalaryHooks/bonusHooks/useBonusDeleteApi';
import { useGetEmployeeBonusApi } from '../../hooks/employeeSalaryHooks/bonusHooks/useGetEmployeeBonusListingApi';
import { useGetEmployeeIncentiveApi } from '../../hooks/employeeSalaryHooks/incentivesHooks/useGetEmployeeIncentiveListingApi';
import { useDeleteIncentiveApi } from '../../hooks/employeeSalaryHooks/incentivesHooks/useIncentiveDeleteApi';
import { filterState } from '../../types/salaryProfileTypes/employeeSalaryTable';
import useFilter from '../../utils/general/useFilter';
import { monthsArray, yearsCurrentAndNext } from '../../utils/salaryTable/data';
import BonusAndIncentiveModal from '../modals/BonusAndIncentiveModal';

const TYPE_LABELS: Record<string, string> = {
    BONUS: 'Bonus',
    JOINING_REFERRAL_BONUS: 'Joining/Referral Bonus',
    COMMISSION: 'Commission',
    LEAVE_ENCASHMENT: 'Leave Encashment',
    SPOT_AWARD: 'Spot Award',
    INCENTIVE: 'Incentive',
};

// Fetched with a generously large limit and combined/paginated client-side, rather than a
// merged server-side query across two entities — Bonus and Incentives stay separate
// backend entities (avoids a data migration); this is a UI/UX consolidation only, per the
// Dev Notes ("the duplicate Bonus section merged into 'Bonus & Incentives'").
const COMBINED_FETCH_LIMIT = 200;
const PAGE_SIZE = 5;

const BonusAndIncentives = () => {
    const location = useLocation();
    const { employeeId } = location.state;

    const [openModal, setOpenModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<any | null>(null);
    const [reloadTable, setReloadTable] = useState(false);
    const [page, setPage] = useState(1);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const initialValues = {
        searchText: '',
        sort: 'ASC',
        page: 1,
        limit: COMBINED_FETCH_LIMIT,
        filter: '',
        year: currentYear,
        month: currentMonth,
    };
    const [filter, setFilter] = useState<filterState>(initialValues);
    const { handleChangeMonth, handleChangeYear } = useFilter({ setFilter });

    const { tableDatas: bonusRows, tableLoading: bonusLoading } = useGetEmployeeBonusApi(
        employeeId,
        1,
        COMBINED_FETCH_LIMIT,
        filter.year,
        filter.month,
        reloadTable
    );
    const { tableDatas: incentiveRows, tableLoading: incentiveLoading } = useGetEmployeeIncentiveApi(
        employeeId,
        1,
        COMBINED_FETCH_LIMIT,
        filter.year,
        filter.month,
        reloadTable
    );

    const { deleteBonusData, isLoading: deletingBonus } = useDeleteBonusApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const { deleteIncentiveData, isLoading: deletingIncentive } = useDeleteIncentiveApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });

    const combined = useMemo(() => {
        const bonusTagged = (bonusRows || []).map((row: any) => ({ ...row, entityType: 'BONUS' as const }));
        const incentiveTagged = (incentiveRows || []).map((row: any) => ({
            ...row,
            entityType: 'INCENTIVE' as const,
            type: 'INCENTIVE',
        }));
        return [...bonusTagged, ...incentiveTagged].sort(
            (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        );
    }, [bonusRows, incentiveRows]);

    const paginatedRows = combined.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleAdd = () => {
        setSelectedRecordData(null);
        setOpenModal(true);
    };
    const handleEdit = (record: any) => {
        setSelectedRecordData(record);
        setOpenModal(true);
    };
    const handleDeleteClick = (record: any) => {
        setSelectedRecordData(record);
        setOpenConfirmationModal(true);
    };
    const handleConfirmDelete = async () => {
        if (selectedRecordData?.entityType === 'INCENTIVE') {
            await deleteIncentiveData(selectedRecordData.id);
        } else {
            await deleteBonusData(selectedRecordData.id);
        }
        setSelectedRecordData(null);
        setReloadTable(p => !p);
    };

    const columns = [
        { title: <Typography.Text>Date Added</Typography.Text>, dataIndex: 'dateAdded', key: 'dateAdded' },
        {
            title: <Typography.Text>Effective Month</Typography.Text>,
            dataIndex: 'effectiveMonth',
            key: 'effectiveMonth',
            render: (effectiveMonth: string) => new Date(effectiveMonth).toLocaleString('en-US', { month: 'long' }),
        },
        {
            title: <Typography.Text>Type</Typography.Text>,
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => <Tag>{TYPE_LABELS[type] || type || 'Bonus'}</Tag>,
        },
        {
            title: <Typography.Text>Amount</Typography.Text>,
            key: 'amount',
            render: (_: unknown, record: any) =>
                `₹ ${formatNumberWithLocalString(record.entityType === 'INCENTIVE' ? record.incentiveAmount : record.bonusAmount)}`,
        },
        { title: <Typography.Text>Details</Typography.Text>, dataIndex: 'details', key: 'details' },
        {
            title: <Typography.Text>Action</Typography.Text>,
            key: 'action',
            render: (_: unknown, record: any) => (
                <Space size="middle">
                    <Button className="border-0" onClick={() => handleDeleteClick(record)}>
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
                <Flex vertical>
                    <Flex justify="space-between" wrap="wrap">
                        <Typography.Text className="font-medium sm:mt-0 xs:mt-2 md:mt-0" style={{ fontSize: '1.246rem' }}>
                            Bonus & Incentives
                        </Typography.Text>
                        <Row gutter={16} className="justify-between xs:mt-10 md:mt-0">
                            <Col className="md:w-40">
                                <Select
                                    options={monthsArray}
                                    className="w-full"
                                    onChange={handleChangeMonth}
                                    defaultValue={currentMonth.toString()}
                                />
                            </Col>
                            <Col className="md:w-40">
                                <Select
                                    options={yearsCurrentAndNext}
                                    className="w-full"
                                    onChange={handleChangeYear}
                                    defaultValue={currentYear}
                                />
                            </Col>
                            <Col className="p-0 m-0">
                                <Button danger className="md:w-32" onClick={handleAdd}>
                                    Add
                                </Button>
                            </Col>
                        </Row>
                    </Flex>
                    <GenericTable
                        className="mt-4"
                        dataSource={paginatedRows}
                        columns={columns}
                        size="small"
                        pagination={false}
                        loading={bonusLoading || incentiveLoading}
                    />
                    {combined.length > 0 && (
                        <Pagination
                            current={page}
                            size="default"
                            className="text-end pt-7"
                            total={combined.length}
                            onChange={setPage}
                            pageSize={PAGE_SIZE}
                        />
                    )}
                </Flex>
            </Col>
            {openModal && (
                <BonusAndIncentiveModal
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                    employeeIdFromProfile={employeeId}
                    selectedRecordData={selectedRecordData}
                    reloadTable={setReloadTable}
                    year={filter.year}
                    month={Number(filter.month)}
                />
            )}
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title={`Are you sure you want to delete this ${selectedRecordData?.entityType === 'INCENTIVE' ? 'incentive' : 'bonus'}?`}
                handleSubmit={handleConfirmDelete}
                isLoading={selectedRecordData?.entityType === 'INCENTIVE' ? deletingIncentive : deletingBonus}
            />
        </Row>
    );
};

export default BonusAndIncentives;
