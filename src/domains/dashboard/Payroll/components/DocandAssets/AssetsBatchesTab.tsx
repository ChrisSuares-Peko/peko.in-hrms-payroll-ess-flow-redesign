import { useState } from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Table, TableProps, Pagination, Flex, Button, Typography } from 'antd';
import { useDispatch } from 'react-redux';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { showToast } from '@src/slices/apiSlice';

import { useDeleteAnnouncementApi } from '../../hooks/announcementHooks/useDeleteAnnouncementApi';
import { AnnouncementDataType } from '../../types/types';

type Props = {
    announcementData: any;
    setCurrentPage: (pageCount: number) => void;
    count?: number;
    isLoading: boolean;
    setRefresh: (value: any) => void;
};

const AssetsBatchesTab = ({
    announcementData,
    setCurrentPage,
    count,
    isLoading,
    setRefresh,
}: Props) => {
    const dispatch = useDispatch();

    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [idToDelete, setIdToDelete] = useState('');

    const columns = (
        handleDelete: (id: string) => void
    ): TableProps<AnnouncementDataType>['columns'] => [
        {
            title: (
                <Typography.Text style={{ color: '#42526D' }} className="font-medium">
                    Date Added
                </Typography.Text>
            ),
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: (
                <Typography.Text style={{ color: '#42526D' }} className="font-medium">
                    Employee Name
                </Typography.Text>
            ),
            dataIndex: 'employeeName',
            key: 'employeeName',
        },

        {
            title: (
                <Typography.Text style={{ color: '#42526D' }} className="font-medium">
                    Document Name
                </Typography.Text>
            ),
            dataIndex: 'documentName',
            key: 'documentName',
        },
        {
            title: (
                <Typography.Text style={{ color: '#42526D' }} className="font-medium">
                    Expiry Date
                </Typography.Text>
            ),
            dataIndex: 'expiryDate',
            key: 'expiryDate',
        },
        {
            title: (
                <Typography.Text style={{ color: '#42526D' }} className="font-medium">
                    Action
                </Typography.Text>
            ),
            dataIndex: 'action',
            key: 'action',

            render: (text, record) => (
                <Flex align="center">
                    <Button className="border-0">
                        <DeleteOutlined
                            className="text-[#E30000]"
                            style={{ fontSize: '20px' }}
                            onClick={() => handleDelete(record.id)}
                        />
                    </Button>
                </Flex>
            ),
        },
    ];
    const { deleteAnnouncementData } = useDeleteAnnouncementApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const HandleDelete = (id: string) => {
        setOpenConfirmationModal(true);
        setIdToDelete(id);
    };
    const handleDeleteAnnouncement = async () => {
        const res = await deleteAnnouncementData(idToDelete);
        if (res) {
            setRefresh(true);
            dispatch(
                showToast({
                    description: 'Announcement deleted successfully',
                    variant: 'success',
                })
            );
        }
        if (!res) {
            dispatch(
                showToast({
                    description: 'Something went wrong, please try again later',
                    variant: 'error',
                })
            );
        }
    };
    return (
        <>
            <Table
                scroll={{ x: 992 }}
                className="mt-4"
                columns={columns(HandleDelete)}
                dataSource={announcementData}
                loading={isLoading}
                size="small"
                pagination={false}
            />
            <Flex className="w-full" justify="end" align="end">
                <Pagination
                    defaultPageSize={10}
                    defaultCurrent={1}
                    total={count}
                    className="mt-4"
                    onChange={(pageCount, pageSize) => {
                        setCurrentPage(pageCount);
                    }}
                />
            </Flex>

            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this announcement?"
                handleSubmit={handleDeleteAnnouncement}
                isLoading={false}
            />
        </>
    );
};

export default AssetsBatchesTab;
