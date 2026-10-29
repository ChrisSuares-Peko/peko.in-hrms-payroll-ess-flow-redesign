import { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Pagination, Flex, Row, Col, Input, Select } from 'antd';
import { useDispatch } from 'react-redux';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { showToast } from '@src/slices/apiSlice';

import CustomModal from './CustomModal';
import { useDeleteAnnouncementApi } from '../../hooks/announcementHooks/useDeleteAnnouncementApi';
import useActiveYearsApi from '../../hooks/OrganizationSettings/useActiveYearsApi';
// import { AnnouncementDataType } from '../../types/types';
import { getAnnouncementColumns } from '../../utils/announcementTableColumns';
import { monthsArray } from '../../utils/salaryTable/data';

type Props = {
    announcementData: any;

    count?: number;
    isLoading: boolean;
    setRefresh: (value: any) => void;
    handleSearch: (value: any) => void;
    handleChangeYear: (value: any) => void;
    handleChangeMonth: (value: any) => void;
    handlePageChange: (page: any, pageSize: any) => void;
    searchText?:string
};

const AnnouncementTab = ({
    announcementData,
    handleChangeMonth,
    handleChangeYear,
    handleSearch,
    handlePageChange,
    count,
    isLoading,
    setRefresh,
    searchText
}: Props) => {
    const initialMonth = new Date().getMonth() + 1;
    const initialYear = new Date().getFullYear();
    const { years } = useActiveYearsApi();

    const dispatch = useDispatch();
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [idToDelete, setIdToDelete] = useState('');

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

   
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
        <Row gutter={[10, 5]}>
            {/* <Col span={24}> */}
            {/* <Flex justify="space-between"> */}
            <Col md={16} xs={24} sm={24} className="xs:mt-6 md:mt-0">
                <Input
                    placeholder="Search by subject"
                    suffix={<SearchOutlined />}
                    allowClear
                    value={searchText}
                    onChange={e => {
                        const value = e.target.value.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
                        handleSearch({ ...e, target: { ...e.target, value } });
                    }}
                />
            </Col>
            <Col md={4} xs={12}>
                <Select
                    options={monthsArray}
                    className="w-full"
                    onChange={handleChangeMonth}
                    defaultValue={initialMonth.toString()}
                />
            </Col>
            <Col md={4} xs={12}>
                <Select
                    options={years?.years}
                    className="w-full"
                    onChange={handleChangeYear}
                    defaultValue={initialYear}
                />
            </Col>
            {/* </Flex> */}
            <GenericTable
                className="mt-4 w-full"
                columns={getAnnouncementColumns({
                        handleDelete: HandleDelete,
                        toggleModal,
                        setSelectedAnnouncement,
                    })}
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
                        // setCurrentPage(pageCount);
                        handlePageChange(pageCount, pageSize);
                    }}
                />
            </Flex>
            <CustomModal
                isModalOpen={isModalOpen}
                modalData={selectedAnnouncement}
                toggleModal={toggleModal}
            />
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this announcement?"
                handleSubmit={handleDeleteAnnouncement}
                isLoading={false}
            />
            {/* </Col> */}
        </Row>
    );
};

export default AnnouncementTab;
