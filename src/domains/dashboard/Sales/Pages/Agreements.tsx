import { useState } from 'react';

import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Modal, Pagination, Select, Spin } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import TypographyText from '@components/atomic/typography/typographyText';
import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';

import { deleteAgreementApi } from '../api/agreements';
import { AGREEMENT_STATUS_PILLS } from '../constants/agreement';
import { TABLE_HEADER_STYLE } from '../constants/style';
import useAgreementActions from '../hooks/agreement/useAgreementActions';
import useAgreementData from '../hooks/agreement/useAgreementData';
import useCustomers from '../hooks/agreement/useCustomers';
import { AgreementRow, AgreementStatus } from '../types/agreement';
import getAgreementColumns from '../utils/table_column/AgreementColumns';

const Agreements = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const { downloadAgreement, downloadingId } = useAgreementActions();
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedAgreement, setSelectedAgreement] = useState<AgreementRow | null>(null);

    const [filters, setFilters] = useState({
        page: 1,
        itemsPerPage: 10,
        searchText: '',
        status: '' as AgreementStatus | '',
        customerId: undefined as number | undefined,
        sortField: undefined as string | undefined,
        sort: undefined as 'ASC' | 'DESC' | undefined,
    });
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { options: customerOptions, isLoading: isCustomersLoading } = useCustomers();

    const { agreements, recordsTotal, isLoading, refetch } = useAgreementData({
        page: filters.page,
        itemsPerPage: filters.itemsPerPage,
        searchText: filters.searchText || undefined,
        status: filters.status || undefined,
        customerId: filters.customerId,
        sortField: filters.sortField,
        sort: filters.sort,
    });

    const goToDetail = (row: AgreementRow) => navigate(`/sales/agreements/${row.id}`);

    const goToQuotationDetail = (row: AgreementRow) => {
        if (row.quotationId) {
            navigate(`/sales/quotations/quotation-details/${row.quotationId}`);
        }
    };

    const goToEdit = (row: AgreementRow) =>
        navigate(`/sales/agreements/${row.id}/edit`, { state: { step: 4 } });

    const handleDeleteClick = (row: AgreementRow) => {
        setSelectedAgreement(row);
        setDeleteModalVisible(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedAgreement) return;

        setIsDeleting(true);
        const resp = await deleteAgreementApi(selectedAgreement.id, { userId, userType });

        if (resp && resp.status) {
            dispatch(
                showToast({
                    description: resp.message || 'Agreement deleted successfully',
                    variant: 'success',
                })
            );
            refetch();
            setDeleteModalVisible(false);
            setSelectedAgreement(null);
        } else if (resp && !resp.status) {
            dispatch(
                showToast({
                    description: resp.message || 'Failed to delete agreement',
                    variant: 'error',
                })
            );
        }
        setIsDeleting(false);
    };

    const statusOptions = AGREEMENT_STATUS_PILLS.filter(p => p.value !== '').map(p => ({
        label: p.label,
        value: p.value,
    }));

    const columns = getAgreementColumns(
        goToDetail,
        goToEdit,
        row => downloadAgreement(row.id, `${row.displayId} — ${row.customer}`),
        handleDeleteClick,
        goToQuotationDetail,
        downloadingId
    );

    return (
        <Content className="px-0">
            <Flex
                justify="space-between"
                align="center"
                className="mb-9 flex-col md:flex-row gap-4 md:gap-0"
            >
                <Flex vertical gap={2} className="w-full md:w-auto">
                    <TypographyText className="text-2xl font-semibold leading-9">
                        Agreements
                    </TypographyText>
                    <TypographyText className="text-gray-500 text-sm font-normal">
                        Manage all customer contracts and track their signing status.
                    </TypographyText>
                </Flex>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="h-9 px-4 bg-[#FF4F4F] border-[#FF4F4F] text-white font-medium text-sm rounded-lg hover:bg-[#e64444] w-full md:w-auto"
                    onClick={() => navigate('/sales/agreements/create')}
                >
                    Create Agreement
                </Button>
            </Flex>

            {/* Search & Filters */}
            <Flex gap={12} className="mb-4 flex-col md:flex-row md:items-center">
                <Input
                    prefix={<SearchOutlined className="text-[#CBD5E1]" />}
                    placeholder="Search agreements"
                    value={searchText}
                    onChange={updateSearchText}
                    className="w-full md:flex-1 h-9 rounded-lg border-[#E4E4E7]"
                />
                <Select
                    placeholder="All Customers"
                    allowClear
                    value={filters.customerId}
                    onChange={val => setFilters(prev => ({ ...prev, customerId: val, page: 1 }))}
                    options={customerOptions}
                    loading={isCustomersLoading}
                    disabled={isCustomersLoading}
                    className="w-full md:w-[140px] h-9"
                />
                <Select
                    placeholder="All Status"
                    allowClear
                    value={filters.status || undefined}
                    onChange={val => setFilters(prev => ({ ...prev, status: val ?? '', page: 1 }))}
                    options={statusOptions}
                    className="w-full md:w-[120px] h-9"
                />
            </Flex>

            {/* Table */}
            <Spin spinning={isLoading}>
                <Flex
                    vertical
                    className="rounded-2xl overflow-hidden outline outline-1 outline-[#EFF1F4] [&>div:first-child]:hidden"
                >
                    <GenericTable
                        dataSource={agreements}
                        columns={columns}
                        rowKey="id"
                        pagination={false}
                        className="w-full"
                        onChange={(_, __, sorter) => {
                            const s = Array.isArray(sorter) ? sorter[0] : sorter;
                            let sort: 'ASC' | 'DESC' | undefined;
                            if (s.order === 'ascend') {
                                sort = 'ASC';
                            } else if (s.order === 'descend') {
                                sort = 'DESC';
                            }
                            setFilters(prev => ({
                                ...prev,
                                sortField: s.order ? String(s.columnKey) : undefined,
                                sort,
                                page: 1,
                            }));
                        }}
                        components={{
                            header: {
                                cell: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
                                    <th
                                        {...props}
                                        style={{ ...props.style, ...TABLE_HEADER_STYLE }}
                                    />
                                ),
                            },
                        }}
                    />
                    <Pagination
                        current={filters.page}
                        pageSize={filters.itemsPerPage}
                        total={recordsTotal}
                        onChange={p => setFilters(prev => ({ ...prev, page: p }))}
                        size="default"
                        className="justify-end text-end py-4 px-5 [&_.ant-pagination-item-active]:!border-[#42526D] [&_.ant-pagination-item-active_a]:!text-[#42526D]"
                        showSizeChanger={false}
                    />
                </Flex>
            </Spin>

            <Modal
                title="Delete Agreement"
                open={deleteModalVisible}
                onOk={handleDeleteConfirm}
                onCancel={() => {
                    setDeleteModalVisible(false);
                    setSelectedAgreement(null);
                }}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{
                    danger: true,
                    loading: isDeleting,
                }}
            >
                <p>
                    Are you sure you want to delete agreement{' '}
                    <strong>{selectedAgreement?.displayId}</strong>? This action cannot be undone.
                </p>
            </Modal>
        </Content>
    );
};

export default Agreements;
