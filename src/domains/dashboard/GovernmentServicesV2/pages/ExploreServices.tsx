import { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Empty, Flex, Input, Row, Skeleton, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import ConsultExpertCard from '../components/ConsultExpertCard';
import ServiceCard from '../components/explore/ServiceCard';
import useGovtServicesListApi from '../hooks/useGovtServicesListApi';

const { Title, Text } = Typography;

const ExploreServices = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const { services: filtered, isLoading } = useGovtServicesListApi({
        searchText: search || undefined,
    });

    return (
        <Flex vertical gap={20} className="p-5">
            <Flex justify="space-between" align="flex-start" wrap="wrap" gap={12}>
                <Flex vertical gap={4}>
                    <Title level={4} className="!mb-0">
                        Government Services
                    </Title>
                    <Text style={{ color: '#8C8C8C' }} className="text-sm">
                        Register, certify, and grow your business with government support
                    </Text>
                </Flex>
                <Button
                    onClick={() => navigate(`${paths.dashboard.governmentServices}/${paths.governmentServices.applications}`)}
                    className="!border-[#ff4f4f] !text-[#ff4f4f] hover:!bg-[#fff5f5] transition-colors"
                >
                    My Applications
                </Button>
            </Flex>

            <ConsultExpertCard />

            <Input
                prefix={<SearchOutlined style={{ color: '#8C8C8C' }} />}
                placeholder="Search registrations (e.g. MSME, Trademark)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
                style={{ borderRadius: 6 }}
            />

            {isLoading ? (
                <Skeleton active paragraph={{ rows: 10 }} />
            ) : (
                <Flex vertical gap={12}>
                    {filtered.length === 0 ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No services found"
                            className="py-10"
                        />
                    ) : (
                        <Row className='mt-1' gutter={[16, 16]}>
                            {filtered.map((service) => (
                                <Col xs={24} sm={12} md={8} lg={6} key={service.id}>
                                    <ServiceCard service={service} />
                                </Col>
                            ))}
                        </Row>
                    )}
                </Flex>
            )}
        </Flex>
    );
};

export default ExploreServices;
