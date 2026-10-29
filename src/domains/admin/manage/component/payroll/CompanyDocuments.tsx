import React, { useState } from 'react';

import {
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    MoreOutlined,
} from '@ant-design/icons';
import { Dropdown, Flex, Menu, Pagination, Typography } from 'antd';
import { Link } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import CategoryModal from './CategoryModal';
import DocHeader from './DocHeader';
import DocModal from './DocModal';
import usePayrollDocs from '../../hooks/payroll/usePayrollDocs';
import useFilter from '../../hooks/useFilters';
import { Document } from '../../types/payrollDocTypes';

type Props = {};

const CompanyDocuments = (props: Props) => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        sortField: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [openCatModal, setCatOpenModal] = useState(false);

    const [deleteModal, setDeleteModal] = useState(false);
    const [catdeleteModal, setCatDeleteModal] = useState(false);

    const [modalData, setModalData] = useState<Document>();
    const [selectedCategory, setSelectedCategory] = useState<{
        id: number;
        categoryName: string;
    } | null>(null);
    const [selectedDocument, setSelectedDocument] = useState<Document | undefined>(undefined);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);

    const {
        isLoading,
        tableData,
        count,
        updateActiveStatus,
        deleteDoc,
        setRefresh,
        downloadReport,
        bufferLoading,
        categoryDelete,
    } = usePayrollDocs(filters);

    const { handlePageChange, handleTableChange } = useFilter({ setFilters });

    const handleActive = (docId: number | string, currentStatus: boolean | number) => {
        // Ensure we handle 0/1 and true/false
        const isActive = currentStatus === 1 || currentStatus === true;
        const newStatus = !isActive; // toggle
        updateActiveStatus({ docId, status: newStatus });
    };
    const handleEdit = (record: Document) => {
        setModalData(record);
        setOpenModal(true);
    };
    const handleDelete = () => {
        deleteDoc(modalData!?.id);
        setDeleteModal(false);
    };
    const handleCatDelete = () => {
        categoryDelete(modalData!?.categoryId);
        setCatDeleteModal(false);
    };
    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            sorter: true,
            key: 'createdAt',
            render: (createdAt: any) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Document Name',
            sorter: true,
            dataIndex: 'documentName',
            key: 'documentName',
        },
        // {
        //     title: 'Category',
        //     dataIndex: ['payrollCategory', 'categoryName'], // backend returns payrollCategory
        //     render: (_: any, data: any) => (
        //         <Typography.Text>{data?.payrollCategory?.categoryName || '-'}</Typography.Text>
        //     ),
        //     key: 'category',
        // },
        {
            title: 'Category',
            dataIndex: ['payrollCategory', 'categoryName'],
            key: 'category',
            render: (_: any, data: any) => {
                const menu = (
                    <Menu
                        items={[
                            {
                                key: 'edit',
                                label: 'Edit',
                                onClick: () => {
                                    setSelectedCategory(data.payrollCategory);
                                    setSelectedDocument(data);
                                    setCatOpenModal(true);
                                },
                            },
                            {
                                key: 'delete',
                                label: 'Delete',
                                danger: true,
                                onClick: () => {
                                    setCatDeleteModal(true);
                                    console.log(catdeleteModal, 'caatdeeltemodal');
                                    setModalData(data);
                                },
                            },
                        ]}
                    />
                );

                return (
                    <Flex justify="space-between" align="center">
                        <Typography.Text>
                            {data?.payrollCategory?.categoryName || '-'}
                        </Typography.Text>

                        <Dropdown overlay={menu} trigger={['click']}>
                            <MoreOutlined className="cursor-pointer" />
                        </Dropdown>
                    </Flex>
                );
            },
        },
        {
            title: 'Document',
            dataIndex: 'document', // backend returns document field
            render: (documentUrl: any) => {
                console.log(documentUrl, 'docuemntUel');
                return documentUrl ? (
                    <Link to={documentUrl} target="_blank" rel="noopener noreferrer">
                        <DownloadOutlined />
                    </Link>
                ) : (
                    ''
                );
            },
            key: 'document',
        },
        {
            title: 'Status',
            dataIndex: 'documentStatus',
            // sorter: true,
            key: 'status',
            render: (status: any, record: Document) =>
                status === 1 || status === true ? (
                    <CheckOutlined
                        className="cursor-pointer text-textLime"
                        onClick={() => handleActive(record.id, status)}
                    />
                ) : (
                    <CloseOutlined
                        className="cursor-pointer text-brandColor"
                        onClick={() => handleActive(record.id, status)}
                    />
                ),
        },
        {
            title: 'Actions',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: Document) => (
                <Flex justify="space-between">
                    <EditOutlined onClick={() => handleEdit(record)} />
                    <DeleteOutlined
                        className=" text-brandColor"
                        onClick={() => {
                            setModalData(record);
                            setDeleteModal(true);
                        }}
                    />
                </Flex>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <DocHeader
                downloadReport={downloadReport}
                setRefresh={setRefresh}
                handleSearch={updateSearchText}
                searchText={searchText}
                bufferLoading={bufferLoading}
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
                className="justify-end text-end pt-7"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            {openModal && (
                <DocModal
                    setRefresh={setRefresh}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                />
            )}{' '}
            {deleteModal && (
                <ConfirmationModal
                    handleSubmit={handleDelete}
                    handleCancel={() => setDeleteModal(false)}
                    isOpen={deleteModal}
                    title="Do you want to proceed with the deletion?"
                    isLoading={false}
                />
            )}
            {catdeleteModal && (
                <ConfirmationModal
                    handleSubmit={handleCatDelete}
                    handleCancel={() => setCatDeleteModal(false)}
                    isOpen={catdeleteModal}
                    title="Do you want to proceed with the deletion of this category?"
                    isLoading={false}
                />
            )}
            {openCatModal && (
                <CategoryModal
                    category={selectedCategory}
                    data={selectedDocument}
                    open={openCatModal}
                    handleCancel={() => setCatOpenModal(false)}
                    setRefresh={setRefresh}
                />
            )}
        </Flex>
    );
};

export default CompanyDocuments;
