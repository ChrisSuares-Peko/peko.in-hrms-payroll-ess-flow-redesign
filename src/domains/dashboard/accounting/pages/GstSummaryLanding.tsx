import { useMemo, useState } from 'react';

import { Empty, Flex, Spin } from 'antd';

import { useGstSummary, useGstSummaryExport } from '../hooks/useReportSummary';
import GstCompanyBar from '../sections/gstSummary/GstCompanyBar';
import GstHeader from '../sections/gstSummary/GstHeader';
import Gstr3bBanner from '../sections/gstSummary/Gstr3bBanner';
import GstRateBreakupCard from '../sections/gstSummary/GstRateBreakupCard';
import GstSummaryCards from '../sections/gstSummary/GstSummaryCards';
import { toGstSummaryView } from '../utils/gstSummaryViewModel';
import { FULL_YEAR, MONTH_PERIOD_OPTIONS, currentFyStart, fyLabel } from '../utils/reportFilters';

const GstSummaryLanding = () => {
    const [fy, setFy] = useState(currentFyStart());
    const [period, setPeriod] = useState(FULL_YEAR);

    // fy alone → full financial year; fy + month → single calendar month within the FY.
    const month = period === FULL_YEAR ? undefined : Number(period);
    const { gstSummary, loading } = useGstSummary({ fy, month });
    const { exporting, exportPdf } = useGstSummaryExport({ fy, month });

    const view = useMemo(() => (gstSummary ? toGstSummaryView(gstSummary) : null), [gstSummary]);

    const periodLabel =
        period === FULL_YEAR
            ? 'Full Year (Apr–Mar)'
            : MONTH_PERIOD_OPTIONS.find(o => o.value === period)?.label;
    const companyPeriod = `${fyLabel(fy)} · ${periodLabel}`;

    return (
        <Flex vertical gap={24} className="px-2 py-5">
            <GstHeader
                fy={fy}
                period={period}
                onFyChange={setFy}
                onPeriodChange={setPeriod}
                onExport={exportPdf}
                exporting={exporting}
            />

            {loading && (
                <Flex align="center" justify="center" className="min-h-[300px]">
                    <Spin />
                </Flex>
            )}

            {!loading && !view && (
                <Flex align="center" justify="center" className="min-h-[300px]">
                    <Empty description="No GST data" />
                </Flex>
            )}

            {!loading && view && (
                <>
                    <GstCompanyBar
                        gstin={view.registration.gstin}
                        pan={view.registration.pan}
                        period={companyPeriod}
                    />

                    <GstSummaryCards stats={view.stats} />

                    <GstRateBreakupCard rows={view.rows} totals={view.totals} />

                    <Gstr3bBanner body={view.bannerBody} />
                </>
            )}
        </Flex>
    );
};

export default GstSummaryLanding;
