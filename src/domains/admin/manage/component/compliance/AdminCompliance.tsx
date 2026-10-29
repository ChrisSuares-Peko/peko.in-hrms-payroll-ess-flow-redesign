import { useState } from 'react';

import { Flex, Pagination } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import useFilter from '@src/domains/admin/manage/hooks/useFilters';

import getComplianceColumns from './ComplianceColumns';
import ComplianceDetailModal from './ComplianceDetailModal';
import ComplianceHeader from './ComplianceHeader';
import useAdminComplianceList from '../../hooks/compliance/useAdminComplianceList';
import { AdminComplianceListFilters, AdminComplianceRecord } from '../../types/compliance';

const AdminCompliance = () => {
    const [filters, setFilters] = useState<AdminComplianceListFilters>({
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        status: '',
        sort: 'DESC',
        sortField: '',
    });

    const [selectedRecord, setSelectedRecord] = useState<AdminComplianceRecord | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const { isLoading, tableData, count, updateStatus } = useAdminComplianceList(filters);

    const { handlePageChange, handleTableChange } = useFilter({ setFilters });

    const handleViewDetails = (record: AdminComplianceRecord) => {
        setSelectedRecord(record);
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setSelectedRecord(null);
    };

    const handleSearch = (text: string) => {
        setFilters(prev => ({ ...prev, searchText: text, page: 1 }));
    };

    const handleStatusFilter = (status: string) => {
        setFilters(prev => ({ ...prev, status, page: 1 }));
    };

    const handleDateChange = (from: string, to: string) => {
        setFilters(prev => ({ ...prev, from, to, page: 1 }));
    };

    const columns = getComplianceColumns({ onViewDetails: handleViewDetails });

    return (
        <Flex vertical gap={20}>
            <ComplianceHeader
                searchText={filters.searchText}
                onSearch={handleSearch}
                onStatusChange={handleStatusFilter}
                onDateChange={handleDateChange}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
                scroll={{ x: 'max-content' }}
            />
            <Pagination
                current={filters.page}
                pageSize={filters.itemsPerPage}
                total={count}
                size="default"
                className="text-end pt-4 justify-end"
                onChange={handlePageChange}
                showSizeChanger={false}
            />
            <ComplianceDetailModal
                open={drawerOpen}
                record={selectedRecord}
                isLoading={isLoading}
                onClose={handleCloseDrawer}
                onUpdate={updateStatus}
            />
        </Flex>
    );
};

export default AdminCompliance;
