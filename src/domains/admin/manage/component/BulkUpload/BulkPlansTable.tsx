import { useState } from 'react';

import { Col, Row, Typography, Table, Button } from 'antd';
import type { TableColumnsType } from 'antd';
import { debounce } from 'lodash';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import SubscriptionPlansForm from '@domains/admin/manage/component/forms/SubscriptionPlansForm';
import { subscriptionPlanSchema } from '@domains/admin/manage/schema/subscription';
import { updateSoftwarePlansBulkJson } from '@domains/admin/manage/slices/bulkUpload';
import { SoftwarePlansBulk } from '@domains/admin/manage/types/subscriptionPlans';
import useSubscriptionPlansUpdate from '@src/domains/admin/manage/hooks/subscriptionPlans/useSubscriptionPlansUpdate';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

const BulkPlansTable = () => {
    const bulkPlan = useAppSelector(state => state.reducer.bulkUploadData).softwarePlanBulk;
    const dispatch = useAppDispatch();
    const [searchText, setSearchText] = useState<string>('');

    const { allSoftwares } = useSubscriptionPlansUpdate(searchText);
    const debounceSearch = debounce((searchQuery: string) => {
        setSearchText(searchQuery);
    }, 300);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedProductInfo, setSelectedProductInfo] = useState<{
        data: SoftwarePlansBulk | undefined;
        index: number;
    }>();
    const handleClick = (index: number) => {
        const product = bulkPlan[index];
        if (product) {
            setIsModalVisible(true);
            setSelectedProductInfo({ data: product, index });
        }
    };

    const columns: TableColumnsType<SoftwarePlansBulk> = [
        {
            title: '#',
            dataIndex: 'index',
            render: (text, record, index) => <Typography.Text>{index + 1}</Typography.Text>,
        },
        {
            title: 'Software Plan Name',
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
                        pagination={{ total: bulkPlan.length }}
                        rowKey={(record, index) => record.TID}
                        columns={columns}
                        scroll={{ x: 992 }}
                        dataSource={bulkPlan}
                    />
                </Col>
            </Row>
            {isModalVisible && (
                <CustomModalWithForm
                    modalTitle="Software Plan Management"
                    open={isModalVisible}
                    handleCancel={() => setIsModalVisible(false)}
                    handleFormSubmit={async values => {
                        const planNameExist = bulkPlan.find(
                            // eslint-disable-next-line eqeqeq
                            (plan, i) => plan.name == values.name && selectedProductInfo?.index != i
                        );
                        const planIdExist = bulkPlan.find(
                            (plan, i) =>
                                // eslint-disable-next-line eqeqeq
                                plan.planId == values.planId && selectedProductInfo?.index != i
                        );
                        if (planNameExist) {
                            dispatch(
                                showToast({
                                    description: 'Plan with this name already exists',
                                    variant: 'error',
                                })
                            );
                        } else if (planIdExist) {
                            dispatch(
                                showToast({
                                    description: 'Plan with this plan id already exists',
                                    variant: 'error',
                                })
                            );
                        } else {
                            dispatch(
                                updateSoftwarePlansBulkJson({
                                    index: selectedProductInfo?.index!,
                                    updatedBulkData: { ...values, errors: [], status: true },
                                })
                            );
                            setIsModalVisible(false);
                        }
                    }}
                    validationSchema={subscriptionPlanSchema}
                    initialValues={{
                        softwareId: selectedProductInfo?.data?.softwareId || '',
                        planId: selectedProductInfo?.data?.planId || '',
                        name: selectedProductInfo?.data?.name || '',
                        vendorPrice: selectedProductInfo?.data?.vendorPrice || '',
                        price: selectedProductInfo?.data?.price || '',
                        validity: selectedProductInfo?.data?.validity || '',
                        noOfUsers: selectedProductInfo?.data?.noOfUsers || 1,
                        features: selectedProductInfo?.data?.features || '',
                    }}
                >
                    <SubscriptionPlansForm
                        allSoftwares={allSoftwares}
                        handleSearch={debounceSearch}
                    />
                </CustomModalWithForm>
            )}
        </>
    );
};

export default BulkPlansTable;
