import { useState } from 'react';

import { Grid, Pagination, PaginationProps } from 'antd';
import { TableProps } from 'antd/lib';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import getNotificationsColumns from './Columns';
import CreateUpdateModal from './CreateUpdateModal';
import NotificationsMobile from './NotificationMobile';
import useDeleteNotification from '../hooks/useDeleteNotification';
import { NotificationData } from '../types/index';

type Props = {
    data: NotificationData[];
    isLoading: boolean;
    current: number;
    handlePageChange: PaginationProps['onChange'];
    count?: number;
    openModal: boolean;
    setOpenModal: (value: React.SetStateAction<boolean>) => void;
    handleRefresh: () => void;
    handleTableChange: TableProps<any>['onChange'];
    accessPermission: any;
};

const NotificationTable = ({
    data,
    isLoading,
    current,
    handlePageChange,
    count,
    openModal,
    setOpenModal,
    handleRefresh,
    handleTableChange,
    accessPermission,
}: Props) => {
    const { useBreakpoint } = Grid;
    const [deleteModal, setDeleteModal] = useState(false);
    const [modalData, setModalData] = useState<NotificationData>();
    const screens = useBreakpoint();
    const dispatch = useAppDispatch();
    const { isLoading: deleteLoading, deleteNotificationData } = useDeleteNotification();
    const handleEdit = (record: NotificationData) => {
        setModalData(record);
        setOpenModal(true);
    };
    const handleDelete = () => {
        deleteNotificationData({ id: modalData!?.id }).then((res: any) => {
            if (res) {
                handleRefresh();
                dispatch(
                    showToast({
                        description: 'Notification deleted successfully',
                        variant: 'success',
                    })
                );
            }
            setDeleteModal(false);
            setModalData(undefined);
        });
    };
    const handleCloseModal = () => {
        setModalData(undefined);
        setOpenModal(false);
    };
    const handleConfirmation = (record: NotificationData) => {
        setModalData(record);
        setDeleteModal(true);
    };
    const columns = getNotificationsColumns({
        handleConfirmation,
        handleEdit,
        accessPermission,
    });

    return (
        <>
            {screens.xs ? (
                <NotificationsMobile data={data} isLoading={isLoading} />
            ) : (
                <GenericTable
                    rowKey={record => record.id.toString()}
                    dataSource={data}
                    columns={columns}
                    bordered={false}
                    loading={isLoading}
                    pagination={false}
                    onChange={handleTableChange}
                />
            )}
            <Pagination
                current={current}
                onChange={handlePageChange}
                size="default"
                className="text-end pt-7"
                total={count}
                showSizeChanger={false}
            />
            {openModal && (
                <CreateUpdateModal
                    data={modalData}
                    open={openModal}
                    handleCancel={handleCloseModal}
                    handleRefresh={handleRefresh}
                />
            )}
            {deleteModal && (
                <ConfirmationModal
                    handleSubmit={handleDelete}
                    handleCancel={() => setDeleteModal(false)}
                    isOpen={deleteModal}
                    title="Do you want to proceed with the deletion?"
                    isLoading={deleteLoading}
                />
            )}
        </>
    );
};

export default NotificationTable;
