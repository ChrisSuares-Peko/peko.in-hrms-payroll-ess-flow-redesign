import { useEffect, useState } from 'react';

import { Button, Col, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useLocation, useNavigate } from 'react-router-dom';

import BulkUploadModal from '@components/molecular/modals/BulkUploadModal';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import BulkPlansTable from '../component/BulkUpload/BulkPlansTable';
import BulkUploadTable from '../component/BulkUpload/BulkSoftwareTable';
import useSoftwarePlansBulkUpload from '../hooks/subscriptionPlans/useSoftwarePlansBulkUpload';
import useSoftwareBulkUpload from '../hooks/subscriptions/useSoftwareBulkUpload';

function ProductsBulkUpload() {
    const navigate = useNavigate();
    const [openBulkModal, setOpenBulkModal] = useState(false);
    const bulkProducts = useAppSelector(state => state.reducer.bulkUploadData);
    const softwareBulkUpload = useSoftwareBulkUpload();
    const softwarePlansBulkUpload = useSoftwarePlansBulkUpload();

    const { state } = useLocation();
    const serviceName: string = state?.serviceName;

    const serviceFunctionsMap: any = {
        softwareProducts: {
            bulkUploadFunction: softwareBulkUpload.BulkUpload,
            bulkCreateFunction: softwareBulkUpload.BulkCreate,
            getTemplateFunction: softwareBulkUpload.getSoftwareBulkUploadTemplate,
            isTemplateLoading: softwareBulkUpload.isTemplateFileLoading,
            isLoading: softwareBulkUpload.isLoading,
            isExcelUploading: softwareBulkUpload.isExcelUploading,
            component: <BulkUploadTable />,
        },
        softwarePlans: {
            bulkUploadFunction: softwarePlansBulkUpload.BulkUpload,
            bulkCreateFunction: softwarePlansBulkUpload.BulkCreate,
            getTemplateFunction: softwarePlansBulkUpload.getSoftwarePlansBulkUploadTemplate,
            isTemplateLoading: softwarePlansBulkUpload.isTemplateFileLoading,
            isLoading: softwarePlansBulkUpload.isLoading,
            isExcelUploading: softwarePlansBulkUpload.isExcelUploading,
            component: <BulkPlansTable />,
        },
        // Add more services here as needed
    };

    const handleClick = async () => {
        let payload;
        if (serviceName === 'softwareProducts') {
            payload = {
                softwaresJsonData: bulkProducts.softwareProductBulk,
                uploadType: 'JSON',
            };
        } else if (serviceName === 'softwarePlans') {
            payload = {
                softwaresJsonData: bulkProducts.softwarePlanBulk,
                uploadType: 'JSON',
            };
        }
        const { bulkCreateFunction } = serviceFunctionsMap[serviceName];
        await bulkCreateFunction(payload);
    };

    useEffect(() => {
        if (!serviceName) {
            navigate(paths.systemUser.manage, { state: { activeKey: '9' } });
        }
    }, [serviceName, navigate]);

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
                            <Button
                                danger
                                type="primary"
                                onClick={handleClick}
                                loading={serviceFunctionsMap[serviceName]?.isLoading}
                            >
                                Submit and Save
                            </Button>
                        </Flex>
                    </Flex>
                </Col>
                <Col xs={24}>{serviceFunctionsMap[serviceName]?.component}</Col>
            </Row>

            {openBulkModal && (
                <BulkUploadModal
                    open={openBulkModal}
                    handleCancel={() => setOpenBulkModal(false)}
                    handleBulkUpload={file =>
                        serviceFunctionsMap[serviceName].bulkUploadFunction(file)
                    }
                    handleTemplateDownload={() =>
                        serviceFunctionsMap[serviceName].getTemplateFunction()
                    }
                    isTemplateFileLoading={serviceFunctionsMap[serviceName].isTemplateLoading}
                    isUploading={serviceFunctionsMap[serviceName].isExcelUploading}
                />
            )}
        </Content>
    );
}

export default ProductsBulkUpload;
