import { Col, Flex, Row, Skeleton, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/hooks';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import KycBanner from '../components/KycBanner';
import ServiceCard from '../components/ServiceCard';
import useTaxOverview from '../hooks/useTaxOverview';
import { TaxService } from '../types';

const SERVICE_ROUTES: Record<string, string> = {
    gst: `${paths.dashboard.taxMore}/${paths.taxMore.gstFiling}`,
};

const LandingPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { data, isLoading } = useTaxOverview();

    const services: TaxService[] = (data?.services ?? []).map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        features: s.features,
        ctaLabel: s.id === 'gst' ? 'Open GST Filing' : 'Open TDS Filing',
        available: s.available,
    }));

    return (
        <Flex vertical gap={24}>
            <Flex vertical gap={4}>
                <Typography.Title level={4} className="!mb-0 !font-semibold text-gray-900">
                    Tax &amp; More
                </Typography.Title>
                <Typography.Text className="text-gray-500 text-sm">
                    Manage all your tax filings and compliance from one place.
                </Typography.Text>
            </Flex>

            {!isLoading && data?.kycRequired && (
                <KycBanner onStartKyc={() => navigate(paths.taxMore.kycVerifyPan)} />
            )}

            {isLoading ? (
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={12}>
                        <Skeleton active />
                    </Col>
                    <Col xs={24} lg={12}>
                        <Skeleton active />
                    </Col>
                </Row>
            ) : (
                <Row gutter={[24, 24]}>
                    {services.map(service => (
                        <Col key={service.id} xs={24} lg={12}>
                            <ServiceCard
                                service={service}
                                locked={data?.kycRequired ?? false}
                                onCtaClick={() =>
                                    service.available
                                        ? navigate(
                                              SERVICE_ROUTES[service.id] ?? paths.dashboard.taxMore
                                          )
                                        : dispatch(
                                              showToast({
                                                  description: `${service.title} is coming soon`,
                                                  variant: 'info',
                                              })
                                          )
                                }
                            />
                        </Col>
                    ))}
                </Row>
            )}
        </Flex>
    );
};

export default LandingPage;
