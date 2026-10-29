import { Col, Flex, Row } from 'antd';

import '../compliance.css';

import DashboardHeader from '../components/Dashboard/DashboardHeader';
import HealthScoreCard from '../components/Dashboard/HealthScoreCard';
import PriorityActions from '../components/Dashboard/PriorityActions';
import QuickAccess from '../components/Dashboard/QuickAccess';
import RecentUpdates from '../components/Dashboard/RecentUpdates';
import StatCards from '../components/Dashboard/StatCards';
import { useComplianceDashboardSummary } from '../hooks/useComplianceDashboardSummary';

export default function ComplianceDashboard() {
  const { summary, isLoading } = useComplianceDashboardSummary();

  return (
    <Flex vertical gap={40} className="p-0 sm:p-6 lg:p-2 min-h-screen bg-white">

      <DashboardHeader />

      <Flex vertical gap={24}>
        <HealthScoreCard score={summary?.healthScore ?? null} isLoading={isLoading} />
        <StatCards summary={summary} isLoading={isLoading} />
      </Flex>

      <Row gutter={[32, 32]} align="stretch">
        <Col xs={24} lg={14}>
          <Flex vertical gap={32} className="h-full">
            <QuickAccess />
            <PriorityActions />
          </Flex>
        </Col>
        <Col xs={24} lg={10}>
          <RecentUpdates />
        </Col>
      </Row>

    </Flex>
  );
}
