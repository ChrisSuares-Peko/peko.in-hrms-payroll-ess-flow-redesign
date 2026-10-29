import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Row, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import dayjs from 'dayjs';

import AlertsPanel from '../components/dashboard/AlertsPanel';
import GoLiveCard from '../components/dashboard/GoLiveCard';
import InternalPurchasesRow from '../components/dashboard/InternalPurchasesRow';
import JournalHealthCard from '../components/dashboard/JournalHealthCard';
import JournalSummaryCard from '../components/dashboard/JournalSummaryCard';
import KpiCard from '../components/dashboard/KpiCard';
import RevenueMixCard from '../components/dashboard/RevenueMixCard';
import TopPerformersCard from '../components/dashboard/TopPerformersCard';
import { faqHint } from '../faq/FaqHint';
import useAccountingDashboard from '../hooks/useAccountingDashboard';
import { buildAlerts, buildSections } from '../utils/dashboardData';

const AccountingDashboard = () => {
    const { data, isLoading, isRefreshing, refresh, retry } = useAccountingDashboard();

    if (isLoading) {
        return (
            <Content>
                <Skeleton active paragraph={{ rows: 10 }} />
            </Content>
        );
    }

    if (!data) {
        return (
            <Content>
                <Card className="w-full border border-borderCard shadow-none rounded-xl">
                    <Flex vertical align="center" gap={12} className="py-6">
                        <Typography.Text className="text-textBody">
                            The accounting dashboard could not be loaded.
                        </Typography.Text>
                        <Button icon={<ReloadOutlined />} onClick={retry}>
                            Retry
                        </Button>
                    </Flex>
                </Card>
            </Content>
        );
    }

    const sections = buildSections(data.sections);
    const alerts = buildAlerts(data.alerts);

    return (
        <Content>
            <Flex justify="space-between" align="center" gap={12} wrap="wrap" className="mb-6">
                <Typography.Text className="text-[13px] text-textBody">
                    Updated {dayjs(data.generatedAt).format('DD MMM YYYY, HH:mm')}
                </Typography.Text>
                <Button icon={<ReloadOutlined />} loading={isRefreshing} onClick={refresh}>
                    Refresh
                </Button>
            </Flex>
            <GoLiveCard />
            <Row gutter={[24, 24]} align="top">
                <Col xs={24} xl={16}>
                    {sections.map((section, index) => (
                        <Row
                            key={section.key}
                            gutter={[20, 20]}
                            className={index === 0 ? '' : 'mt-8'}
                        >
                            <Col span={24}>
                                <Typography.Text className="text-xl">
                                    {section.title}
                                </Typography.Text>
                            </Col>
                            <Col span={24}>
                                <JournalSummaryCard
                                    journal={section.journal}
                                    scope={
                                        section.key === 'today'
                                            ? "today's orders"
                                            : "this month's orders"
                                    }
                                />
                            </Col>
                            {section.kpis.map(kpi => (
                                <Col key={kpi.key} xs={24} sm={12} xl={8}>
                                    <KpiCard
                                        title={kpi.title}
                                        value={kpi.value}
                                        icon={kpi.icon}
                                        tone={kpi.tone}
                                        to={kpi.to}
                                        help={faqHint('Dashboard', 'KPIs', kpi.title)}
                                    />
                                </Col>
                            ))}
                            <InternalPurchasesRow kpis={section.internalKpis} />
                        </Row>
                    ))}
                </Col>
                <Col xs={24} xl={8}>
                    <Row gutter={[24, 24]}>
                        <Col span={24}>
                            <AlertsPanel alerts={alerts} />
                        </Col>
                        <Col xs={24} md={8} xl={24}>
                            <JournalHealthCard section={data.sections.monthly} />
                        </Col>
                        <Col xs={24} md={8} xl={24}>
                            <RevenueMixCard section={data.sections.monthly} />
                        </Col>
                        <Col xs={24} md={8} xl={24}>
                            <TopPerformersCard rankings={data.rankings} />
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Content>
    );
};

export default AccountingDashboard;
