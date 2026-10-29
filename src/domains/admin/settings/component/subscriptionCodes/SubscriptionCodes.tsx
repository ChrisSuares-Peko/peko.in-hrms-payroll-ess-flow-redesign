import React, { useState, useEffect } from 'react';

import { Flex, Pagination } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import useFilter from '@src/domains/admin/manage/hooks/useFilters';
import { useAppSelector } from '@src/hooks/store';
import { useFindRolesService } from '@utils/findRolesService';

import SubscriptionCodesHeader from './SubscriptionCodesHeader';
import SubscriptionCodesModal from './SubscriptionCodesModal';
import useSubscriptionCodeTable from '../../hooks/subscriptionCodes/useSubscriptionCodeTable';
import useUpdateCodes from '../../hooks/subscriptionCodes/useUpdateCodes';
import { RolePermissionAccessData } from '../../types/vendors';

const SubscriptionCodes = () => {
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Subscription Codes'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const {
        columns,
        filters,
        setFilters,
        modalData,
        openModal,
        closeFormModal,
        deleteModal,
        closeDeleteModal,
        tableData,
        count,
        isLoading,
        setRefresh,
        searchText,
        updateSearchText,
        downloadReport,
    } = useSubscriptionCodeTable();
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });
    const { deleteActivationCode, isLoading: deleteLoader } = useUpdateCodes({
        handleCancel: closeDeleteModal,
        setRefresh,
    });

    return (
        <Flex vertical gap={20}>
            <SubscriptionCodesHeader
                setRefresh={setRefresh}
                handleSearch={updateSearchText}
                searchText={searchText}
                accessPermission={accessPermission}
                handleDownloadReport={downloadReport}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            {openModal && (
                <SubscriptionCodesModal
                    data={modalData}
                    open={openModal}
                    handleCancel={closeFormModal}
                    setRefresh={setRefresh}
                />
            )}
            {deleteModal && (
                <ConfirmationModal
                    handleSubmit={() => deleteActivationCode(modalData!?.id)}
                    handleCancel={closeDeleteModal}
                    isOpen={deleteModal}
                    title="Do you want to proceed with the deletion?"
                    isLoading={deleteLoader}
                />
            )}
        </Flex>
    );
};

export default SubscriptionCodes;
