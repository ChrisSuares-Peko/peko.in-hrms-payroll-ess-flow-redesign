import { describe, expect, it } from 'vitest';

import { DashboardMetrics, DashboardRankingRow } from '../types/dashboard';
import {
    CHART_CARD_TITLES,
    RANKING_VIEWS,
    SERIES_COLOR,
    STATUS_COLORS,
    buildJournalHealth,
    buildRankingRows,
    buildRevenueMix,
} from '../utils/dashboardCharts';

const monthly: Partial<DashboardMetrics> = {
    journalEntries: 56,
    failedEntries: 2,
    skippedEntries: 1,
    notRecordedEntries: 0,
    commission: 1820.4,
    platformFee: 640,
    subscriptions: 1490,
    otherSales: 725.5,
};

describe('the chart registry', () => {
    it('names the three cards and the three ranking views', () => {
        expect([...CHART_CARD_TITLES]).toEqual(['Journal Health', 'Revenue Mix', 'Top Performers']);
        expect(RANKING_VIEWS.map(view => view.key)).toEqual(['services', 'vendors', 'partners']);
        expect(RANKING_VIEWS.map(view => view.label)).toEqual(['Services', 'Vendors', 'Partners']);
    });

    it('keeps the bar colour out of the red and amber families the status ring uses', () => {
        expect(SERIES_COLOR).toBe('#2a78d6');
        expect(Object.values(STATUS_COLORS)).not.toContain(SERIES_COLOR);
    });
});

describe('buildJournalHealth', () => {
    it('lays the four states out in ring order with their counts and the total', () => {
        const { segments, total, empty } = buildJournalHealth(monthly);

        expect(segments.map(segment => [segment.label, segment.value])).toEqual([
            ['Recorded', 56],
            ['Failed', 2],
            ['Skipped', 1],
            ['Not recorded', 0],
        ]);
        expect(segments.map(segment => segment.color)).toEqual([
            STATUS_COLORS.recorded,
            STATUS_COLORS.failed,
            STATUS_COLORS.skipped,
            STATUS_COLORS.notRecorded,
        ]);
        expect(total).toBe(59);
        expect(empty).toBe(false);
    });

    it('reports an empty ring when nothing was recorded, so the chart can draw a placeholder', () => {
        expect(buildJournalHealth({})).toMatchObject({ total: 0, empty: true });
        expect(buildJournalHealth(undefined).segments.every(segment => segment.value === 0)).toBe(
            true
        );
    });
});

describe('buildRevenueMix', () => {
    it('sizes every line against the largest and formats the rupees', () => {
        const rows = buildRevenueMix(monthly);

        expect(rows.map(row => row.label)).toEqual([
            'Commission',
            'Platform fee',
            'Subscription income',
            'Sales as principal',
        ]);
        expect(rows.map(row => row.pct)).toEqual([100, 35, 82, 40]);
        expect(rows.map(row => row.display)).toEqual([
            '₹ 1,820.40',
            '₹ 640.00',
            '₹ 1,490.00',
            '₹ 725.50',
        ]);
    });

    it('draws no bar at all for a line with nothing in it', () => {
        const rows = buildRevenueMix({ commission: 100 });

        expect(rows.map(row => row.pct)).toEqual([100, 0, 0, 0]);
        expect(buildRevenueMix(undefined).every(row => row.pct === 0)).toBe(true);
    });
});

describe('buildRankingRows', () => {
    const rows: DashboardRankingRow[] = [
        { id: null, name: null, amount: 52310.2, orders: 615 },
        { id: 77, name: 'Gulf Reach', amount: 12980.4, orders: 1 },
    ];

    it('sizes each row against the top one and labels the default tree', () => {
        const built = buildRankingRows(rows);

        expect(built.map(row => row.label)).toEqual(['Peko (Default)', 'Gulf Reach']);
        expect(built.map(row => row.pct)).toEqual([100, 25]);
        expect(built.map(row => row.display)).toEqual(['₹ 52,310.20', '₹ 12,980.40']);
        expect(built.map(row => row.sub)).toEqual(['615 orders', '1 order']);
        expect(built.map(row => row.key)).toEqual(['default', '77']);
    });

    it('returns nothing for a missing or empty list', () => {
        expect(buildRankingRows(undefined)).toEqual([]);
        expect(buildRankingRows(null)).toEqual([]);
        expect(buildRankingRows([])).toEqual([]);
    });
});
