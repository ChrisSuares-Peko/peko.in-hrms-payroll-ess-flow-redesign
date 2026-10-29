import { useEffect, useMemo, useState } from 'react';

import { Button, Col, Flex, Input, Row, Select, Typography } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { getSurcharge } from '@src/services/surcharge';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';

import { setPaymentData } from '../../payments/slices/payment';
import AddBeneficiaryDrawer from '../components/AddBeneficiaryDrawer';
import BeneficiaryVehicles from '../components/BeneficiaryVehicles';
import ChallanDetailsDrawer from '../components/ChallanDetailsDrawer';
import ChallanTable from '../components/ChallanTable';
import DroomLogo from '../components/DroomLogo';
import useChallanBeneficiaries from '../hooks/useChallanBeneficiaries';
import useVehicleChallans from '../hooks/useVehicleChallans';
import { setChallanCart } from '../slices/challanSlice';
import {
    Challan,
    ChallanBeneficiary,
    ChallanFilter,
    ChallanRow,
    isChallanPayable,
    isCourtMatter,
} from '../types/index';
import { buildChallanPayment } from '../utils/buildChallanPayment';

const { Text } = Typography;

const FILTER_OPTIONS: { label: string; value: ChallanFilter }[] = [
    { label: 'All', value: 'All' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Paid', value: 'Paid' },
    { label: 'Court', value: 'Court' },
];

const Branding = () => (
    <Flex align="center" gap={10}>
        <Text className="text-base text-[#486284]">Partnered with</Text>
        <DroomLogo />
    </Flex>
);

const BillChallanPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dispatch = useAppDispatch();
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const { challans, isLoading, fetchForVehicle } = useVehicleChallans();
    const {
        beneficiaries,
        addBeneficiary,
        editBeneficiary,
        removeBeneficiary,
        isLoading: beneficiariesLoading,
    } = useChallanBeneficiaries();

    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
    const [vehicleInput, setVehicleInput] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [beneficiaryToEdit, setBeneficiaryToEdit] = useState<ChallanBeneficiary | null>(null);

    const [filter, setFilter] = useState<ChallanFilter>('All');
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [drawerChallan, setDrawerChallan] = useState<Challan | null>(null);

    const handleFetch = (vehicleNumber: string) => {
        const vrn = vehicleNumber.toUpperCase().trim();
        if (!vrn) {
            dispatch(
                showToast({ description: 'Enter a vehicle registration number', variant: 'info' })
            );
            return;
        }
        setSelectedVehicle(vrn);
        setFilter('All');
        setSelectedRowKeys([]);
        fetchForVehicle(vrn);
    };

    // Deep-link: reopen the challan list when returning from payment (?vehicle=<VRN>).
    useEffect(() => {
        const vehicle = searchParams.get('vehicle');
        if (vehicle) handleFetch(vehicle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const rows: ChallanRow[] = useMemo(
        () =>
            challans
                .filter(c => {
                    if (filter === 'Pending')
                        return c.challan_status === 'Pending' && !isCourtMatter(c);
                    if (filter === 'Paid') return c.challan_status === 'Paid';
                    if (filter === 'Court') return isCourtMatter(c);
                    return true;
                })
                .map(c => ({ ...c, key: c.challan_number, isPayable: isChallanPayable(c) })),
        [challans, filter]
    );

    const goToPayment = async (toPay: Challan[]) => {
        if (!toPay.length) return;
        const challanTotal = toPay.reduce((sum, c) => sum + (c.challan_price ?? c.amount), 0);
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
                navigatePath: `${paths.dashboard.billPayments}/${paths.billPayments.challan}?vehicle=${encodeURIComponent(selectedVehicle || toPay[0]?.registration_number || '')}`,
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
        goToPayment(toPay);
    };

    // ---- LIST VIEW ----
    if (selectedVehicle) {
        return (
            <Flex vertical gap={20}>
                <Flex justify="end" align="center">
                    <Branding />
                </Flex>

                <Text className="font-medium text-lg sm:text-xl">
                    Challans for {selectedVehicle}
                </Text>

                <Flex justify="space-between" align="center" gap={12} className="flex-wrap">
                    <Select
                        value={filter}
                        onChange={value => {
                            setFilter(value);
                            setSelectedRowKeys([]);
                        }}
                        options={FILTER_OPTIONS}
                        style={{ width: 120 }}
                    />
                    <Flex gap={10}>
                        <Button
                            className="border-[#FF4F4F] text-[#FF4F4F]"
                            onClick={() =>
                                navigate(
                                    `${paths.dashboard.billPayments}/${paths.billPayments.challan}/${paths.billPayments.challanOrders}`
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

                <ChallanTable
                    data={rows}
                    isLoading={isLoading}
                    selectedRowKeys={selectedRowKeys}
                    onSelectChange={setSelectedRowKeys}
                    onView={setDrawerChallan}
                    onPay={challan => goToPayment([challan])}
                    showVehicleColumn={false}
                    emptyText="No challans found for this vehicle"
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
    }

    // ---- ENTRY VIEW ----
    return (
        <>
            <Row>
                <Col span={24}>
                    <Flex justify="space-between" align="center" gap={16} wrap="wrap">
                        <Text className="font-medium text-lg sm:text-xl">Traffic Challan</Text>
                        <Flex align="center" gap={16}>
                            <Button
                                className="border-[#FF4F4F] text-[#FF4F4F]"
                                onClick={() =>
                                    navigate(
                                        `${paths.dashboard.billPayments}/${paths.billPayments.challan}/${paths.billPayments.challanOrders}`
                                    )
                                }
                            >
                                Order History
                            </Button>
                            <Branding />
                        </Flex>
                    </Flex>
                </Col>
                <Col xl={13} className="mt-5 h-fit w-full xl:sticky xl:top-0">
                    <Flex vertical gap={8} className="max-w-md">
                        <Text className="text-sm">
                            <span className="text-[#FF4F4F]">*</span> Vehicle Registration Number
                        </Text>
                        <Input
                            placeholder="Enter vehicle registered number"
                            value={vehicleInput}
                            maxLength={15}
                            onChange={e => setVehicleInput(e.target.value)}
                            onPressEnter={() => handleFetch(vehicleInput)}
                        />
                        <Button
                            type="primary"
                            className="mt-3 w-fit !bg-[#FF4F4F] hover:!bg-[#E84545]"
                            onClick={() => handleFetch(vehicleInput)}
                        >
                            Fetch Challans
                        </Button>
                    </Flex>
                </Col>
                <Col
                    xl={{ span: 9, offset: 2 }}
                    className="mt-10 w-full rounded-3xl sm:mt-5 sm:bg-gray-50 sm:p-6 xl:mt-5"
                >
                    <BeneficiaryVehicles
                        beneficiaries={beneficiaries}
                        isLoading={beneficiariesLoading}
                        onFetch={handleFetch}
                        onAdd={() => {
                            setBeneficiaryToEdit(null);
                            setIsAddOpen(true);
                        }}
                        onEdit={beneficiary => {
                            setBeneficiaryToEdit(beneficiary);
                            setIsAddOpen(true);
                        }}
                    />
                </Col>
            </Row>

            <AddBeneficiaryDrawer
                open={isAddOpen}
                editValue={beneficiaryToEdit}
                onClose={() => {
                    setIsAddOpen(false);
                    setBeneficiaryToEdit(null);
                }}
                onSubmit={async beneficiary => {
                    if (beneficiaryToEdit) {
                        await editBeneficiary({ ...beneficiaryToEdit, ...beneficiary });
                    } else {
                        await addBeneficiary(beneficiary);
                    }
                    setIsAddOpen(false);
                    setBeneficiaryToEdit(null);
                }}
                onDelete={async beneficiaryId => {
                    await removeBeneficiary(beneficiaryId);
                    setIsAddOpen(false);
                    setBeneficiaryToEdit(null);
                }}
            />
        </>
    );
};

export default BillChallanPage;
