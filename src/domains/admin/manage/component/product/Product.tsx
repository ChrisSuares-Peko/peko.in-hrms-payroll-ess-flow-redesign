import { Suspense, lazy, useState } from 'react';

import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Pagination, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { formattedDateTime } from '@utils/dateFormat';

import ProductHeader from './ProductHeader';
import useFilter from '../../hooks/useFilters';
import useGetProduct from '../../hooks/useGetProduct';
import useGetProductImages from '../../hooks/useGetProductImages';
import useUpdateProduct from '../../hooks/useUpdateProduct';
import { Product as productDetails } from '../../types/products';

const ProductModal = lazy(() => import('./ProductModal'));

const Product = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
    };
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [modalData, setModalData] = useState<productDetails>();
    const { isLoading, tableData, count, updateActiveStatus, deleteDoc, setRefresh } =
        useGetProduct(filters);
    const { categoryData, vendorData, updateProducts, allVendors, createProducts } =
        useUpdateProduct({ searchCategories: '', searchVendors: '' });
    const { loading, getProductImage, productImages } = useGetProductImages();
    const { handleSearch, handlePageChange, handleTableChange } = useFilter({ setFilters });
    const handleActive = (prodId: number | string, status: any) => {
        let active;
        if (status === 1 || status === true) active = false;
        else active = true;
        updateActiveStatus({ prodId, status: active });
    };
    const handleEdit = (record: productDetails) => {
        setModalData(record);
        getProductImage(record.id);
        setOpenModal(true);
    };
    const handleDelete = () => {
        deleteDoc(modalData!?.id);
        setDeleteModal(false);
    };
    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt: any) => formattedDateTime(new Date(createdAt)),
        },
        {
            title: 'Product Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Category Name',
            dataIndex: 'category',
            key: 'category',
            render: (category: any) => <Typography.Text>{category?.categoryName}</Typography.Text>,
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (price: any) => <Typography.Text>₹ {price}</Typography.Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: any, record: productDetails) =>
                status === 1 || status === true ? (
                    <CheckOutlined
                        className="cursor-pointer text-textLime"
                        onClick={() => handleActive(record.id, record.status)}
                    />
                ) : (
                    <CloseOutlined
                        className="cursor-pointer text-brandColor"
                        onClick={() => handleActive(record.id, record.status)}
                    />
                ),
        },
        {
            title: 'Actions',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: productDetails) => (
                <Flex justify="space-between">
                    <EditOutlined className="mr-3" onClick={() => handleEdit(record)} />
                    <DeleteOutlined
                        className=" text-brandColor ml-3"
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
            <ProductHeader
                allVendors={allVendors}
                createProducts={createProducts}
                updateProducts={updateProducts}
                vendorData={vendorData}
                categoryData={categoryData}
                setRefresh={setRefresh}
                handleSearch={handleSearch}
                searchText={filters.searchText}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading || loading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7 justify-end"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            <Suspense>
                {openModal && (
                    <ProductModal
                        productImages={productImages}
                        createProducts={createProducts}
                        allVendors={allVendors}
                        categoryData={categoryData}
                        updateProducts={updateProducts}
                        vendorData={vendorData}
                        setRefresh={setRefresh}
                        data={modalData}
                        open={openModal}
                        handleCancel={() => setOpenModal(false)}
                    />
                )}
            </Suspense>

            {deleteModal && (
                <ConfirmationModal
                    handleSubmit={handleDelete}
                    handleCancel={() => setDeleteModal(false)}
                    isOpen={deleteModal}
                    title="Do you want to proceed with the deletion?"
                    isLoading={false}
                />
            )}
        </Flex>
    );
};

export default Product;
