import { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Badge, Col, Empty, Flex, Input, Row, Skeleton, Tag, Tabs, Typography } from 'antd';

import ServiceCard from '../components/explore/ServiceCard';
import { useGovtServicesListApi, useMyApplicationsApi } from '../hooks';
import { ServiceAuthority, ServiceCategory, ServiceTab } from '../types';

const { Title, Text } = Typography;

const tabs: ServiceTab[] = ['Mandatory', 'Regulatory Dependent', 'Good-to-have'];

const tabDescriptions: Record<ServiceTab, string> = {
    Mandatory: 'Legally required for all businesses',
    'Regulatory Dependent': 'Required based on your industry / authority',
    'Good-to-have': 'Optional — boost benefits & credibility',
};

const TAB_CATEGORIES: Record<ServiceTab, ServiceCategory[]> = {
    Mandatory: ['All', 'Tax & Compliance', 'Licenses & Permits'],
    'Regulatory Dependent': [
        'All', 'Tax & Compliance', 'Licenses & Permits', 'Certifications', 'Trade Enablement',
        'Pharma & Drugs', 'Pesticides', 'Fertilizers', 'Hospital & Healthcare',
        'Hotels & Hospitality', 'Data Security', 'Financial Services',
        'Telecom & IT', 'Education', 'Transport & Logistics',
    ],
    'Good-to-have': ['All', 'Business Recognition', 'Certifications', 'Trade Enablement', 'Intellectual Property'],
};

const AUTHORITY_OPTIONS: ServiceAuthority[] = ['All', 'Central', 'State'];

const ExploreServices = () => {
    const [activeTab, setActiveTab] = useState<ServiceTab>('Mandatory');
    const [activeCategory, setActiveCategory] = useState<ServiceCategory>('All');
    const [activeAuthority, setActiveAuthority] = useState<ServiceAuthority>('All');
    const [search, setSearch] = useState('');

    const { applications } = useMyApplicationsApi();
    const { services: filtered, tabCounts, isLoading } = useGovtServicesListApi({
        searchText: search || undefined,
        category: activeCategory !== 'All' ? activeCategory : undefined,
        tag: activeTab,
        authority: activeTab === 'Regulatory Dependent' && activeAuthority !== 'All' ? activeAuthority : undefined,
    });

    const tabItems = tabs.map((tab) => ({
        key: tab,
        label: (
            <Flex align="center" gap={6}>
                <span>{tab}</span>
                <Badge
                    count={tabCounts[tab]}
                    style={{
                        backgroundColor: activeTab === tab ? '#FF3A3A' : '#F0F0F0',
                        color: activeTab === tab ? '#FFFFFF' : '#8C8C8C',
                        fontWeight: 500,
                        fontSize: 11,
                        boxShadow: 'none',
                    }}
                />
            </Flex>
        ),
    }));

    const handleTabChange = (key: string) => {
        setActiveTab(key as ServiceTab);
        setActiveCategory('All');
        setActiveAuthority('All');
    };

    const categories = TAB_CATEGORIES[activeTab];

    return (
        <Flex vertical gap={20} className="p-5">
            <Flex vertical gap={4}>
                <Title level={4} className="!mb-0">
                    Government Services
                </Title>
                <Text style={{ color: '#8C8C8C' }} className="text-sm">
                    Register, certify, and grow your business with government support
                </Text>
            </Flex>

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
                <>
                    <Tabs
                        activeKey={activeTab}
                        onChange={handleTabChange}
                        items={tabItems}
                        className="!mb-0"
                    />

                    <Flex className='-mt-3' vertical gap={12}>
                        <Text style={{ color: '#8C8C8C' }}>
                            {tabDescriptions[activeTab]}
                        </Text>

                        {activeTab === 'Regulatory Dependent' && (
                            <Flex gap={8} wrap="wrap">
                                {AUTHORITY_OPTIONS.map((auth) => {
                                    const isActive = activeAuthority === auth;
                                    return (
                                        <Tag
                                            key={auth}
                                            onClick={() => setActiveAuthority(auth)}
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: isActive ? '#FF3A3A' : '#FFFFFF',
                                                borderColor: isActive ? '#FF3A3A' : '#D9D9D9',
                                                color: isActive ? '#FFFFFF' : '#595959',
                                                margin: 0,
                                                padding: '4px 12px',
                                                borderRadius: 100,
                                            }}
                                        >
                                            {auth}
                                        </Tag>
                                    );
                                })}
                            </Flex>
                        )}

                        <Flex gap={8} wrap="wrap">
                            {categories.map((cat) => {
                                const isActive = activeCategory === cat;
                                return (
                                    <Tag
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        style={{
                                            cursor: 'pointer',
                                            backgroundColor: isActive ? '#FF3A3A' : '#FFFFFF',
                                            borderColor: isActive ? '#FF3A3A' : '#D9D9D9',
                                            color: isActive ? '#FFFFFF' : '#595959',
                                            margin: 0,
                                            padding: '4px 12px',
                                            borderRadius: 6,
                                        }}
                                    >
                                        {cat}
                                    </Tag>
                                );
                            })}
                        </Flex>

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
                                        <ServiceCard
                                            service={service}
                                            application={applications.find(a => a.service === service.accessKey)}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </Flex>
                </>
            )}
        </Flex>
    );
};

export default ExploreServices;
