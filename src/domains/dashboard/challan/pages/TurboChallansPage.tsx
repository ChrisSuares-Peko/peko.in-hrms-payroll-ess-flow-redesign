import { useMemo, useState } from 'react';

import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Pagination, Select, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { getSurcharge } from '@src/services/surcharge';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';

import { setPaymentData } from '../../payments/slices/payment';
import useManageFleetApi from '../../turbo/hooks/useManageFleet';
import ChallanDetailsDrawer from '../components/ChallanDetailsDrawer';
import ChallanSummaryCards from '../components/ChallanSummaryCards';
import ChallanTable from '../components/ChallanTable';
import DroomLogo from '../components/DroomLogo';
import useFleetChallans from '../hooks/useFleetChallans';
import { setChallanCart } from '../slices/challanSlice';
import {
    Challan,
    ChallanFilter,
    ChallanRow,
    isChallanPayable,
    isCourtMatter,
} from '../types/index';
import { buildChallanPayment } from '../utils/buildChallanPayment';

const { Text, Title } = Typography;

const PAGE_SIZE = 10;

const FILTER_OPTIONS: { label: string; value: ChallanFilter }[] = [
    { label: 'All', value: 'All' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Paid', value: 'Paid' },
    { label: 'Court', value: 'Court' },
];

const TurboChallansPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const { challans, summary, isLoading, isRefreshing, lastUpdated, refetch } = useFleetChallans();
    // Only the total fleet vehicle count is needed here (for the challan_pay_clicked Moengage
    // event) — a minimal page/itemsPerPage keeps this an otherwise-unused listing call cheap.
    const { count: fleetVehicleCount } = useManageFleetApi({ page: 1, itemsPerPage: 1 });

    const [filter, setFilter] = useState<ChallanFilter>('All');
    const [search, setSearch] = useState('');
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [drawerChallan, setDrawerChallan] = useState<Challan | null>(null);
    const [page, setPage] = useState(1);

    const rows: ChallanRow[] = useMemo(() => {
        const search_ = search.trim().toLowerCase();
        return challans
            .filter(c => {
                if (filter === 'Pending')
                    return c.challan_status === 'Pending' && !isCourtMatter(c);
                if (filter === 'Paid') return c.challan_status === 'Paid';
                if (filter === 'Court') return isCourtMatter(c);
                return true;
            })
            .filter(c =>
                search_
                    ? c.registration_number.toLowerCase().includes(search_) ||
                      c.challan_number.toLowerCase().includes(search_) ||
                      c.offense_details.toLowerCase().includes(search_)
                    : true
            )
            .map(c => ({ ...c, key: c.challan_number, isPayable: isChallanPayable(c) }));
    }, [challans, filter, search]);

    // The table renders one page at a time — a large fleet puts every challan in the DOM otherwise.
    const pagedRows = useMemo(
        () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [rows, page]
    );

    const goToPayment = async (toPay: Challan[]) => {
        if (!toPay.length) return;
        const challanTotal = toPay.reduce((sum, c) => sum + (c.challan_price ?? c.amount), 0);
        if (typeof Moengage?.track_event === 'function') {
            const [firstChallan] = toPay;
            Moengage.track_event('challan_pay_clicked', {
                vehicle_number: firstChallan.registration_number,
                fleet_vehicle_count: fleetVehicleCount,
                amount: challanTotal,
                challan_date: firstChallan.challan_date,
                challan_no: firstChallan.challan_number,
            });
        }
        // Seeds the generic checkout/payment-result Moengage pipeline (usePaymentApi.ts /
        // PaymentSuccess.tsx / PaymentFailure.tsx) — moengage_prefix drives the
        // "challan_checkout" / "challan_payment_result" event names.
        sessionStorage.setItem(
            'service_details',
            JSON.stringify({
                serviceDetails: {
                    moengage_prefix: 'challan',
                    status: toPay.every(c => c.challan_status === 'Paid') ? 'paid' : 'pending',
                },
            })
        );
        const surcharge = await getSurcharge({
            userId: id,
            userType: role,
            amount: challanTotal,
            accessKey: accessKeys.challan,
            quantity: toPay.length,
        });
        const convenienceFee = surcharge
            ? Number(surcharge.surcharge) +
              (surcharge.ccf1Amount ? Number(surcharge.ccf1Amount) / 100 : 0)
            : 0;
        const { billSummary, paymentSummary, totalAmount, payload } = buildChallanPayment(
            toPay,
            convenienceFee
        );
        dispatch(setChallanCart(toPay));
        dispatch(
            setPaymentData({
                billSummary,
                paymentSummary,
                totalAmount,
                title: 'Challan Summary',
                payload,
                url: 'payment/challan/payment',
                earningCashbackAmount: Number(surcharge && surcharge.corporateCashback) || 0,
                navigatePath: `${paths.dashboard.turbo}/${paths.turbo.challans}`,
            })
        );
        navigate(paths.dashboard.payments);
    };

    const handlePaySelected = () => {
        const toPay = challans.filter(c => selectedRowKeys.includes(c.challan_number));
        if (!toPay.length) {
            dispatch(
                showToast({ description: 'Select at least one challan to pay', variant: 'info' })
            );
            return;
        }
        // Droom processes one reg_num per order — block a bulk that spans multiple vehicles.
        if (new Set(toPay.map(c => c.registration_number)).size > 1) {
            dispatch(
                showToast({
                    description: 'You can select and pay challans for one vehicle at a time.',
                    variant: 'info',
                })
            );
            return;
        }
        goToPayment(toPay);
    };

    return (
        <Flex vertical gap={20}>
            {/* Branding row */}
            <Flex justify="end" align="center" gap={10} className="pointer-events-none sm:-mt-8">
                <Text className="text-base text-[#486284]">Partnered with</Text>
                <DroomLogo />
            </Flex>

            {/* Title + actions */}
            <Flex className="flex-col justify-between gap-4 md:flex-row md:items-end">
                <Flex vertical gap={6}>
                    <Title level={3} className="!mb-0 !text-[#0A0A0A]">
                        Challans
                    </Title>
                    <Text className="text-base text-[#486284]">
                        Review and pay traffic challans across your fleet
                    </Text>
                </Flex>
                <Flex gap={15}>
                    <Button
                        className="border-[#FF4F4F] text-[#FF4F4F]"
                        onClick={() =>
                            navigate(
                                `${paths.dashboard.turbo}/${paths.turbo.challans}/${paths.turbo.challanOrders}`
                            )
                        }
                    >
                        Order History
                    </Button>
                    <Button
                        type="primary"
                        disabled={selectedRowKeys.length === 0}
                        onClick={handlePaySelected}
                    >
                        Pay Selected
                    </Button>
                </Flex>
            </Flex>

            <ChallanSummaryCards summary={summary} />

            {/* Filter + search */}
            <Flex justify="space-between" align="center" gap={12} className="flex-wrap">
                <Select
                    value={filter}
                    onChange={value => {
                        setFilter(value);
                        setSelectedRowKeys([]);
                        setPage(1);
                    }}
                    options={FILTER_OPTIONS}
                    style={{ width: 120 }}
                />
                <Flex align="center" gap={12} className="flex-wrap">
                    {lastUpdated && (
                        <Text className="text-xs text-[#868686]">
                            Updated {dayjs(lastUpdated).format('DD MMM, HH:mm')}
                        </Text>
                    )}
                    <Button
                        icon={<ReloadOutlined spin={isRefreshing} />}
                        disabled={isRefreshing}
                        onClick={refetch}
                    >
                        Refresh
                    </Button>
                    <Input
                        placeholder="Search"
                        allowClear
                        prefix={<SearchOutlined className="text-[rgba(0,0,0,0.25)]" />}
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        style={{ width: 331 }}
                    />
                </Flex>
            </Flex>

            <ChallanTable
                data={pagedRows}
                // Cached challans render straight away; the background refresh only blocks the
                // table on a cold cache, where "No challans found" would otherwise be a lie.
                isLoading={isLoading || (isRefreshing && challans.length === 0)}
                selectedRowKeys={selectedRowKeys}
                onSelectChange={setSelectedRowKeys}
                onView={setDrawerChallan}
                onPay={challan => goToPayment([challan])}
            />

            <Pagination
                className="text-center sm:text-end"
                total={rows.length}
                current={page}
                pageSize={PAGE_SIZE}
                onChange={setPage}
            />

            <ChallanDetailsDrawer
                open={!!drawerChallan}
                challan={drawerChallan}
                onClose={() => setDrawerChallan(null)}
                onPay={challan => {
                    setDrawerChallan(null);
                    goToPayment([challan]);
                }}
            />
        </Flex>
    );
};

export default TurboChallansPage;
