import { Suspense, lazy, useEffect, useState } from 'react';

import { Button, Col, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import BulkProductsTable from '../component/product/bulkUpload/BulkProductsTable';
import { useProductsBulkUpload } from '../hooks/useProductsBulkUpload';
import { BulkProductsUploadPayload } from '../types/products';

const BulkUploadModal = lazy(() => import('../component/product/bulkUpload/BulkUploadModal'));

function ProductsBulkUpload() {
    const navigate = useNavigate();
    const [openBulkModal, setOpenBulkModal] = useState(false);
    const { BulkCreate, isLoading } = useProductsBulkUpload();
    const bulkProducts = useAppSelector(state => state.reducer.bulkProducts);
    const handleClick = async () => {
        const payload: BulkProductsUploadPayload = {
            productsJsonData: bulkProducts,
            uploadType: 'JSON',
        };
        await BulkCreate(payload);
    };

    useEffect(() => {
        const { length } = bulkProducts;
        if (length < 1) navigate(paths.systemUser.manage, { state: { activeKey: '6' } });
    }, [bulkProducts, navigate]);

    return (
        <Content>
            <Row className="mt-3">
                <Col span={24}>
                    <Flex className="flex-col md:justify-between md:flex-row">
                        <Typography.Paragraph className="text-xl font-medium text-neutral-700">
                            Preview Bulk Upload
                        </Typography.Paragraph>
                        <Flex gap={10} className="justify-end">
                            <Button danger onClick={() => setOpenBulkModal(true)}>
                                Reupload
                            </Button>
                            <Button danger type="primary" loading={isLoading} onClick={handleClick}>
                                Submit and Save
                            </Button>
                        </Flex>
                    </Flex>
                </Col>
                <Col xs={24}>
                    <BulkProductsTable />
                </Col>
            </Row>

            <Suspense>
                {openBulkModal && (
                    <BulkUploadModal
                        open={openBulkModal}
                        handleCancel={() => setOpenBulkModal(false)}
                    />
                )}
            </Suspense>
        </Content>
    );
}

export default ProductsBulkUpload;
