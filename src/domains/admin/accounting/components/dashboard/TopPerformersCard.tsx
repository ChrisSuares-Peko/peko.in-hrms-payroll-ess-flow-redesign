import { useState } from 'react';

import { TrophyOutlined } from '@ant-design/icons';
import { Flex, Segmented, Typography } from 'antd';

import ChartCard from './ChartCard';
import RankRows from './RankRows';
import { faqHint } from '../../faq/FaqHint';
import { DashboardRankingKey, DashboardRankings } from '../../types/dashboard';
import { CHART_CAPTION, RANKING_VIEWS, buildRankingRows } from '../../utils/dashboardCharts';

export const RANKINGS_UNAVAILABLE = 'Rankings could not be loaded.';
export const RANKINGS_EMPTY = 'No successful orders this month yet.';

const TopPerformersCard = ({ rankings }: { rankings?: DashboardRankings | null }) => {
    const [view, setView] = useState<DashboardRankingKey>('services');
    const current = RANKING_VIEWS.find(item => item.key === view) ?? RANKING_VIEWS[0];
    const rows = rankings ? buildRankingRows(rankings[current.key]) : [];

    return (
        <ChartCard
            icon={<TrophyOutlined />}
            title="Top Performers"
            caption={CHART_CAPTION}
            help={faqHint('Dashboard', 'Charts', 'Top Performers')}
            extra={
                <Segmented
                    size="small"
                    aria-label="Rank by"
                    value={view}
                    onChange={value => setView(value as DashboardRankingKey)}
                    options={RANKING_VIEWS.map(item => ({ value: item.key, label: item.label }))}
                />
            }
        >
            <Flex vertical gap={12}>
                <RankRows
                    rows={rows}
                    emptyText={rankings ? RANKINGS_EMPTY : RANKINGS_UNAVAILABLE}
                />
                <Typography.Text className="text-[11px] text-textBody">
                    {current.basis}
                </Typography.Text>
            </Flex>
        </ChartCard>
    );
};

export default TopPerformersCard;
