import { Suspense, lazy, useEffect, useState } from 'react';

import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tooltip, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import useFilter from '@domains/admin/manage/hooks/useFilters';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';

import ProductHeader from './ProductHeader';
import useGetProduct from '../../hooks/products/useGetProduct';
import useGetProductImages from '../../hooks/products/useGetProductImages';
import useUpdateProduct from '../../hooks/products/useUpdateProduct';
import { Product as productDetails, RolePermissionAccessData } from '../../types/products';

const ProductModal = lazy(() => import('./ProductModal'));

const Product = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        sortField: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [modalData, setModalData] = useState<productDetails>();
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Products'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const {
        isLoading,
        tableData,
        count,
        updateActiveStatus,
        deleteDoc,
        setRefresh,
        downloadReport,
    } = useGetProduct(filters);
    const { categoryData, vendorData, updateProducts, allVendors, createProducts } =
        useUpdateProduct({ searchCategories: '', searchVendors: '' });
    const { loading, getProductImage, productImages } = useGetProductImages();
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });
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
            sorter: true,
            visibilityToggle: true,
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt: any) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Product Name',
            // sorter: true,
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Description',
            sorter: true,
            visibilityToggle: true,
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Category Name',
            sorter: true,
            visibilityToggle: true,
            dataIndex: ['category', 'categoryName'],
            key: 'category',
            render: (_: any, data: any) => (
                <Typography.Text>{data.category.categoryName}</Typography.Text>
            ),
        },
        {
            title: 'Quantity',
            sorter: true,
            dataIndex: 'quantity',
            key: 'quantity',
        },
        {
            title: 'Price',
            sorter: true,
            dataIndex: 'price',
            key: 'price',
            render: (price: any) => <Typography.Text> ₹ {price}</Typography.Text>,
        },
        {
            title: 'Status',
            sorter: true,
            dataIndex: 'status',
            key: 'status',
            render: (status: any, record: productDetails) => (
                <Tooltip
                    placement="top"
                    title={
                        !accessPermission?.update
                            ? 'Sorry, you do not have permission to perform this action'
                            : ''
                    }
                >
                    <span>
                        {status === 1 || status === true ? (
                            <CheckOutlined
                                className={`cursor-pointer ${
                                    accessPermission?.update ? 'text-textLime' : 'text-gray-400'
                                }`}
                                style={{
                                    cursor: accessPermission?.update ? 'pointer' : 'not-allowed',
                                }}
                                onClick={() =>
                                    accessPermission?.update &&
                                    handleActive(record.id, record.status)
                                }
                                disabled={!accessPermission?.update}
                            />
                        ) : (
                            <CloseOutlined
                                className={`cursor-pointer ${
                                    accessPermission?.update ? 'text-brandColor' : 'text-gray-400'
                                }`}
                                style={{
                                    cursor: accessPermission?.update ? 'pointer' : 'not-allowed',
                                }}
                                onClick={() =>
                                    accessPermission?.update &&
                                    handleActive(record.id, record.status)
                                }
                                disabled={!accessPermission?.update}
                            />
                        )}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: 'Actions',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: productDetails) => (
                <Flex justify="space-between">
                    <Tooltip
                        placement="top"
                        title={
                            !accessPermission?.update
                                ? 'Sorry, you do not have permission to perform this action'
                                : ''
                        }
                    >
                        <span>
                            {!accessPermission?.update ? (
                                <EditOutlined
                                    style={{ color: 'gray', cursor: 'not-allowed' }}
                                    disabled
                                />
                            ) : (
                                <EditOutlined onClick={() => handleEdit(record)} />
                            )}
                        </span>
                    </Tooltip>
                    <Tooltip
                        placement="top"
                        title={
                            !accessPermission?.update
                                ? 'Sorry, you do not have permission to perform this action'
                                : ''
                        }
                    >
                        <span>
                            {!accessPermission?.update ? (
                                <DeleteOutlined
                                    className="ml-7"
                                    style={{ color: 'gray', cursor: 'not-allowed' }}
                                    disabled
                                />
                            ) : (
                                <DeleteOutlined
                                    className=" text-brandColor ml-7"
                                    onClick={() => {
                                        setModalData(record);
                                        setDeleteModal(true);
                                    }}
                                />
                            )}
                        </span>
                    </Tooltip>
                </Flex>
            ),
        },
    ];
    return (
        <Flex vertical gap={20}>
            <ProductHeader
                downloadReport={downloadReport}
                allVendors={allVendors}
                createProducts={createProducts}
                updateProducts={updateProducts}
                vendorData={vendorData}
                categoryData={categoryData}
                setRefresh={setRefresh}
                handleSearch={updateSearchText}
                searchText={searchText}
                accessPermission={accessPermission}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading || loading}
                // scroll={{ x: 'max-content' }}
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
