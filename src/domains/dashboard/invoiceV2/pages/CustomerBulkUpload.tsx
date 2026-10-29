import { useState } from 'react';

import { Button, Col, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { useAppSelector } from '@src/hooks/store';

import BulkUploadCustomerModal from '../components/customers/BulkUploadCustomerModal';
import BulkUploadCustomerTable from '../components/customers/BulkUploadCustomerTable';
import { useBulkCustomerCreateApi } from '../hooks/customer/useBulkCustomerCreateApi';

const CustomerBulkUpload = () => {
    const [openBulkUploadModal, setOpenBulkUploadModal] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [errorCount, setErrorCount] = useState(0);

    const { bulkCreate, isLoading } = useBulkCustomerCreateApi();
    const customerData = useAppSelector(state => state.reducer.invoiceBulkCustomer);

    const handleClick = async () => {
        await bulkCreate(customerData);
    };

    const handleCountChange = (total: number, errors: number) => {
        setTotalCount(total);
        setErrorCount(errors);
    };

    return (
        <Content>
            <Row className="mt-3">
                <Col span={24}>
                    <Flex className="flex-col md:justify-between md:flex-row">
                        <Typography.Paragraph className="text-xl font-medium text-neutral-700">
                            Preview Bulk Upload
                        </Typography.Paragraph>

                        <Flex gap={10} className="justify-end">
                            <Button danger onClick={() => setOpenBulkUploadModal(true)}>
                                Reupload
                            </Button>
                            <Button
                                type="primary"
                                danger
                                onClick={handleClick}
                                loading={isLoading}
                                disabled={errorCount > 0 || totalCount === 0}
                            >
                                Save &amp; Submit
                            </Button>
                        </Flex>
                    </Flex>

                    <Typography.Paragraph className="text-gray-500 mt-3">
                        Total Records: <span className="font-medium">{totalCount}</span>
                    </Typography.Paragraph>
                    <Typography.Paragraph className="text-red-500 text-sm mt-1">
                        ({errorCount} out of {totalCount} records have errors)
                    </Typography.Paragraph>
                </Col>
                <Col xs={24}>
                    <BulkUploadCustomerTable onCountChange={handleCountChange} />
                </Col>
            </Row>

            {openBulkUploadModal && (
                <BulkUploadCustomerModal
                    open={openBulkUploadModal}
                    handleCancel={() => setOpenBulkUploadModal(false)}
                />
            )}
        </Content>
    );
};

export default CustomerBulkUpload;
