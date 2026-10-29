import { BarChartOutlined } from '@ant-design/icons';

import ChartCard from './ChartCard';
import RankRows from './RankRows';
import { faqHint } from '../../faq/FaqHint';
import { DashboardSection } from '../../types/dashboard';
import { CHART_CAPTION, buildRevenueMix } from '../../utils/dashboardCharts';

const RevenueMixCard = ({ section }: { section?: DashboardSection }) => (
    <ChartCard
        icon={<BarChartOutlined />}
        title="Revenue Mix"
        caption={CHART_CAPTION}
        help={faqHint('Dashboard', 'Charts', 'Revenue Mix')}
    >
        <RankRows rows={buildRevenueMix(section)} emptyText="No revenue this month yet." />
    </ChartCard>
);

export default RevenueMixCard;
