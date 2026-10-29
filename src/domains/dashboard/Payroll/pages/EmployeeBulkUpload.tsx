import { useState } from 'react';

import { Button, Col, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { useAppSelector } from '@src/hooks/store';

import BulkUploadTable from '../components/Employees/BulkUploadTable';
import BulkUploadModal from '../components/modals/BulkUploadModal';
import SalaryProcessingModal from '../components/modals/SalaryProcessingModal';
import { useBulkCreateApi } from '../hooks/employeeHooks/useBulkCreateApi';
import { BulkUploadCreatePayload } from '../types/types';

function EmployeesBulkUpload() {
    const [openBulkUploadModal, setOpenBulkUploadModal] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [errorCount, setErrorCount] = useState(0);
    // const [successCount, setSuccessCount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openSalaryProcessingModal, setOpenSalaryProcessingModal] = useState(false);

    const { BulkCreate } = useBulkCreateApi();

    const empData = useAppSelector(state => state.reducer.BulkUpload);
    const handleClick = async () => {
        const payload: BulkUploadCreatePayload = {
            jsonData: empData,
        };
        setIsSubmitting(true);

        // await BulkCreate(payload);
        try {
            await BulkCreate(payload);
        } catch (error) {
            console.error('Error during bulk create:', error);
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleCountChange = (total: any, errors: any, successes: any) => {
        setTotalCount(total);
        setErrorCount(errors);
        // setSuccessCount(successes);
    };
    return (
        <Content>
            <Row className="mt-3">
                <Col span={24}>
                    <Flex className="flex-col md:justify-between md:flex-row">
                        <Typography.Paragraph className="text-xl font-medium  text-neutral-700">
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
                                loading={isSubmitting}
                                disabled={errorCount > 0 || totalCount === 0}
                            >
                                Save & Submit
                            </Button>
                        </Flex>
                    </Flex>

                    <Typography.Paragraph className="text-gray-500 mt-3">
                        Total Records: <span className="bold-text">{totalCount}</span>
                    </Typography.Paragraph>
                    <Typography.Paragraph className="text-red-500 text-sm mt-1">
                        {' '}
                        ({errorCount} out of {totalCount} records have errors)
                    </Typography.Paragraph>
                </Col>
                <Col xs={24}>
                    <BulkUploadTable onCountChange={handleCountChange} />
                </Col>
            </Row>

            {openBulkUploadModal && (
                <BulkUploadModal
                    open={openBulkUploadModal}
                    handleCancel={() => setOpenBulkUploadModal(false)}
                />
            )}

            <SalaryProcessingModal
                open={openSalaryProcessingModal}
                handleCancel={() => setOpenSalaryProcessingModal(false)}
            />
        </Content>
    );
}

export default EmployeesBulkUpload;
