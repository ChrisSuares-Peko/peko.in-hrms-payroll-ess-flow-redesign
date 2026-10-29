import React from 'react';

import { Col, Row, Skeleton } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import VendorDrawer from '../components/Vendor/VendorDrawer';
import { useVendor } from '../hooks/useVendor';

const VendorDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isLoading, detail } = useVendor(id);

    if (isLoading) {
        return (
            <Row justify="center">
                <Col xs={24} md={20} lg={16} xl={14}>
                    <Skeleton active paragraph={{ rows: 8 }} />
                </Col>
            </Row>
        );
    }

    if (!detail) return null;

    return (
        <Row justify="center">
            <Col xs={24} md={20} lg={16} xl={14}>
                <VendorDrawer
                    record={detail}
                    onClose={() => navigate(`${paths.dashboard.procure}/${paths.procure.vendor.index}`)}
                />
            </Col>
        </Row>
    );
};

export default VendorDetailsPage;
