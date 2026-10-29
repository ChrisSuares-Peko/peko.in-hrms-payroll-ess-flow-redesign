import { useState } from 'react';

import { Col, Row, Typography, Table, Button } from 'antd';
import type { TableColumnsType } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import BulkUploadEditModal from './BulkUploadEditModal';
import useUpdateProduct from '../../../hooks/products/useUpdateProduct';
import { deleteProductByIndex } from '../../../slices/bulkProducts';
import { bulkProduct } from '../../../types/products';

const BulkProductsTable = () => {
    const dispatch = useAppDispatch();

    const bulkProducts = useAppSelector(state => state.reducer.bulkProducts);
    const { categoryData, allVendors } = useUpdateProduct({
        searchCategories: '',
        searchVendors: '',
    });

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedProductInfo, setSelectedProductInfo] = useState<{
        data: bulkProduct | undefined;
        index: number;
    }>();
    const handleClick = (index: number) => {
        const product = bulkProducts[index];
        if (product) {
            setIsModalVisible(true);
            setSelectedProductInfo({ data: product, index });
        }
    };
    const handleRemove = (index: number) => {
        const product = bulkProducts[index];
        if (product) {
            dispatch(deleteProductByIndex(index));
        }
    };

    const columns: TableColumnsType<bulkProduct> = [
        {
            title: <Typography.Text style={{ color: '#42526D' }}>#</Typography.Text>,
            dataIndex: 'index',
            render: (text, record, index) => <Typography.Text>{index + 1}</Typography.Text>,
        },
        {
            title: <Typography.Text style={{ color: '#42526D' }}>Product Name</Typography.Text>,
            dataIndex: 'name',
            render: (name: string) => <Typography.Text>{name}</Typography.Text>,
        },
        {
            title: <Typography.Text style={{ color: '#42526D' }}>Validation</Typography.Text>,
            dataIndex: 'status',
            render: (status: boolean) => (
                <Typography.Text style={{ color: status ? 'green' : 'red' }}>
                    {status ? 'Success' : 'Error'}
                </Typography.Text>
            ),
        },
        {
            title: <Typography.Text style={{ color: '#42526D' }}>Message</Typography.Text>,
            dataIndex: 'errors',
            render: (errors: string[]) => (
                <ul style={{ color: 'red' }}>
                    {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                    ))}
                </ul>
            ),
        },
        {
            title: '',
            dataIndex: 'index',
            width: '10%',
            render: (text, record, index) => (
                <Button
                    type="link"
                    onClick={() => handleRemove(record.TID)}
                    style={{ color: 'red' }}
                >
                    Remove
                </Button>
            ),
        },
        {
            title: '',
            dataIndex: 'index',
            key: 'index',
            width: '10%',
            render: (text, record, index) => (
                <Button
                    type="link"
                    onClick={() => handleClick(record.TID)}
                    style={{ color: 'red' }}
                >
                    View and Edit
                </Button>
            ),
        },
    ];

    return (
        <>
            <Row className="mt-4" gutter={[0, 20]}>
                <Col span={24}>
                    <Table
                        pagination={{ total: bulkProducts.length }}
                        rowKey={(record, index) => record.TID}
                        columns={columns}
                        scroll={{ x: 992 }}
                        dataSource={bulkProducts}
                    />
                </Col>
            </Row>
            {isModalVisible && (
                <BulkUploadEditModal
                    open={isModalVisible}
                    handleCancel={() => setIsModalVisible(false)}
                    productData={selectedProductInfo?.data}
                    productIndex={selectedProductInfo?.index}
                    allVendors={allVendors}
                    categoryData={categoryData}
                />
            )}
        </>
    );
};

export default BulkProductsTable;
