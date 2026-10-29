/* eslint-disable eqeqeq */
import { useState } from 'react';

import { Col, Row, Typography, Table, Button } from 'antd';
import type { TableColumnsType } from 'antd';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import SubscriptionForm from '@domains/admin/manage/component/forms/SubscriptionForm';
import useSubscriptionUpdate from '@domains/admin/manage/hooks/subscriptions/useSubscriptionUpdate';
import { subscriptionSchema } from '@domains/admin/manage/schema/subscription';
import { updateSoftwareProductBulkJson } from '@domains/admin/manage/slices/bulkUpload';
import { SoftwareProductBulk } from '@domains/admin/manage/types/subscription';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

const BulkProductsTable = () => {
    const bulkSoftwares = useAppSelector(state => state.reducer.bulkUploadData).softwareProductBulk;
    const dispatch = useAppDispatch();
    const { allVendors, subscriptionCategories } = useSubscriptionUpdate();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedProductInfo, setSelectedProductInfo] = useState<{
        data: SoftwareProductBulk | undefined;
        index: number;
    }>();
    const handleClick = (index: number) => {
        const product = bulkSoftwares[index];
        if (product) {
            setIsModalVisible(true);
            setSelectedProductInfo({ data: product, index });
        }
    };

    const columns: TableColumnsType<SoftwareProductBulk> = [
        {
            title: '#',
            dataIndex: 'index',
            render: (text, record, index) => <Typography.Text>{index + 1}</Typography.Text>,
        },
        {
            title: 'Software Name',
            dataIndex: 'name',
            render: (name: string) => <Typography.Text>{name}</Typography.Text>,
        },
        {
            title: 'Validation',
            dataIndex: 'status',
            render: (status: boolean) => (
                <Typography.Text style={{ color: status ? 'green' : 'red' }}>
                    {status ? 'Success' : 'Error'}
                </Typography.Text>
            ),
        },
        {
            title: 'Message',
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
                <Button type="link" onClick={() => handleClick(record.TID)}>
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
                        rowKey={(record, index) => record.TID}
                        columns={columns}
                        scroll={{ x: 992 }}
                        dataSource={bulkSoftwares}
                        pagination={{ total: bulkSoftwares.length }}
                    />
                </Col>
            </Row>
            {isModalVisible && (
                <CustomModalWithForm
                    modalTitle="Software Product Management"
                    open={isModalVisible}
                    handleCancel={() => setIsModalVisible(false)}
                    handleFormSubmit={async values => {
                        const softwareNameExist = bulkSoftwares.find(
                            (software, i) =>
                                software.name == values.name && selectedProductInfo?.index != i
                        );
                        const productIdExist = bulkSoftwares.find(
                            (software, i) =>
                                software.productId == values.productId &&
                                selectedProductInfo?.index != i
                        );
                        if (softwareNameExist) {
                            dispatch(
                                showToast({
                                    description: 'Software with this name already exists',
                                    variant: 'error',
                                })
                            );
                        } else if (productIdExist) {
                            dispatch(
                                showToast({
                                    description: 'Software with this software id already exists',
                                    variant: 'error',
                                })
                            );
                        } else {
                            const vendor = allVendors.find(v => v.value === values.vendorId);
                            const category = subscriptionCategories.find(
                                v => v.value === values.categoryId
                            );
                            const emailsArray = values.pekoEmail
                                .split(/[,\s]+/)
                                .filter((email: string) => email.trim() !== '');
                            dispatch(
                                updateSoftwareProductBulkJson({
                                    index: selectedProductInfo?.index!,
                                    updatedBulkData: {
                                        ...values,
                                        pekoEmail: emailsArray,
                                        vendor: vendor?.label,
                                        category: category?.label,
                                        errors: [],
                                        status: true,
                                    },
                                })
                            );
                            setIsModalVisible(false);
                        }
                    }}
                    validationSchema={subscriptionSchema}
                    initialValues={{
                        productId: selectedProductInfo?.data?.productId || '',
                        name: selectedProductInfo?.data?.name || '',
                        description: selectedProductInfo?.data?.description || '',
                        features: selectedProductInfo?.data?.features || '',
                        pekoEmail: selectedProductInfo?.data?.pekoEmail.join(',') || '',
                        sendMail:
                            typeof selectedProductInfo?.data?.sendMail === 'boolean'
                                ? selectedProductInfo.data.sendMail
                                : selectedProductInfo?.data?.sendMail?.toLowerCase() === 'true',
                        typeOfOrder: selectedProductInfo?.data?.typeOfOrder || '',
                        vendorId: selectedProductInfo?.data?.vendorId || '',
                        categoryId: selectedProductInfo?.data?.categoryId || '',
                        discount: selectedProductInfo?.data?.discount || 0,
                    }}
                >
                    <SubscriptionForm
                        vendorData={allVendors}
                        subscriptionCategories={subscriptionCategories}
                        hideImageField
                    />
                </CustomModalWithForm>
            )}
        </>
    );
};

export default BulkProductsTable;
