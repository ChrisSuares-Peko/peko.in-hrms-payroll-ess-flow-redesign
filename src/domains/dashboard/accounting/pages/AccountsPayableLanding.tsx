import { useMemo, useState } from 'react';

import { Col, Empty, Flex, Row, Spin } from 'antd';

import { useAccountsPayable } from '../hooks/useReportSummary';
import ApAgingAnalysisCard from '../sections/accountsPayable/ApAgingAnalysisCard';
import ApHeader from '../sections/accountsPayable/ApHeader';
import OutstandingPayablesTrendCard from '../sections/accountsPayable/OutstandingPayablesTrendCard';
import PaymentObligationsSummary from '../sections/accountsPayable/PaymentObligationsSummary';
import VendorBillsCard from '../sections/accountsPayable/VendorBillsCard';
import VendorDistributionCard from '../sections/accountsPayable/VendorDistributionCard';
import { statusOptions } from '../utils/accountsPayableData';
import { toApView } from '../utils/accountsPayableViewModel';
import { FULL_YEAR, currentFyStart } from '../utils/reportFilters';

const AccountsPayableLanding = () => {
    const [fy, setFy] = useState(currentFyStart());
    const [period, setPeriod] = useState(FULL_YEAR);
    const [status, setStatus] = useState(statusOptions[0].value);

    // fy alone → full financial year; fy + month → single calendar month within the FY.
    const month = period === FULL_YEAR ? undefined : Number(period);
    const { accountsPayable, loading } = useAccountsPayable({ fy, month });

    const view = useMemo(
        () => (accountsPayable ? toApView(accountsPayable) : null),
        [accountsPayable]
    );

    const visibleBills = useMemo(() => {
        if (!view) return [];
        return status === 'all' ? view.billsRows : view.billsRows.filter(b => b.status === status);
    }, [view, status]);

    const billsData = useMemo(() => {
        const totals = visibleBills.reduce(
            (a, b) => ({
                amount: a.amount + b.amount,
                paid: a.paid + b.paid,
                outstanding: a.outstanding + b.outstanding,
                count: a.count + 1,
            }),
            { amount: 0, paid: 0, outstanding: 0, count: 0 }
        );
        return { bills: visibleBills, totals, totalLabel: `Totals (${totals.count} bills)` };
    }, [visibleBills]);

    return (
        <Flex vertical gap={24} className="px-2 py-5">
            <ApHeader
                fy={fy}
                period={period}
                status={status}
                onFyChange={setFy}
                onPeriodChange={setPeriod}
                onStatusChange={setStatus}
            />

            {loading && (
                <Flex align="center" justify="center" className="min-h-[300px]">
                    <Spin />
                </Flex>
            )}

            {!loading && !view && (
                <Flex align="center" justify="center" className="min-h-[300px]">
                    <Empty description="No payables data" />
                </Flex>
            )}

            {!loading && view && (
                <>
                    <VendorBillsCard
                        bills={billsData.bills}
                        totals={billsData.totals}
                        totalLabel={billsData.totalLabel}
                    />

                    <ApAgingAnalysisCard
                        rows={view.aging.rows}
                        totals={view.aging.totals}
                        outstandingTag={view.aging.outstandingTag}
                    />

                    <Row gutter={[24, 24]} className="w-full">
                        <Col xs={24} xl={14}>
                            <OutstandingPayablesTrendCard trend={view.trend} />
                        </Col>
                        <Col xs={24} xl={10}>
                            <VendorDistributionCard bars={view.distribution} />
                        </Col>
                    </Row>

                    <PaymentObligationsSummary
                        stats={view.payment.stats}
                        segments={view.payment.segments}
                        total={view.payment.total}
                    />
                </>
            )}
        </Flex>
    );
};

export default AccountsPayableLanding;
