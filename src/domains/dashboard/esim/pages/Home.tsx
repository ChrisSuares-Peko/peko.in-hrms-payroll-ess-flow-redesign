import { useState, useEffect, useRef } from 'react';

import { DownOutlined, MobileOutlined } from '@ant-design/icons';
import { Button, Col, Collapse, Flex, Image, Row, Select, Space, Typography } from 'antd';
import { IoLocationOutline } from 'react-icons/io5';
import Lottie from 'react-lottie';
import { Link } from 'react-router-dom';

import animation from '@assets/animation/EsimLoader.json';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { showToast } from '@src/slices/apiSlice';

import { links } from '../../CorporateTravel/utils/data';
import DefaultImage from '../assets/images/Esim.png';
import DefaultImageSm from '../assets/images/EsimSm.png';
import About from '../components/about/About';
import { CountryPlansBlock } from '../components/home/CountryPlans';
import OrderSummaryCard from '../components/home/OrderSummaryCard';
import { PurchasingForSelector } from '../components/home/PurchasingForSelector';
import { RegionCoverage } from '../components/home/RegionCoverage';
import { TravelTypeSelector } from '../components/home/TravelTypeSelector';
import useGetCountry from '../hooks/useGetCountry';
import useGetRegions from '../hooks/useGetRegions';
import usePayment from '../hooks/usePayment';
import { clearPendingSelections, setPendingSelections } from '../slice/esimSlice';
import { PurchasingFor } from '../types';
import { TravelType } from '../types/eSIM';
import { convertMBtoGB } from '../utils/helperFunction';
import '../assets/style.css';

const { Text } = Typography;
type SelectedPlansMap = Record<string, any>;

const Home = () => {
    type QuantityMap = Record<string, number>;

    const [quantities, setQuantities] = useState<QuantityMap>({});
    const [selectedCountry, setSelectedCountry] = useState<string[]>([]);
    const [travelType, setTravelType] = useState<TravelType>('single');
    const [activeCountry, setActiveCountry] = useState<string | null>(null);
    const [countryCodes, setCountryCodes] = useState<Record<string, string>>({});
    const [selectedPlans, setSelectedPlans] = useState<SelectedPlansMap>({});
    const [purchasingFor, setPurchasingFor] = useState<PurchasingFor>({
        type: 'self',
        name: '',
        email: '',
    });
    const [shouldScrollToSummary, setShouldScrollToSummary] = useState(false);
    const orderSummaryRef = useRef<HTMLDivElement>(null);
    const hasSelectedPlan = Object.keys(selectedPlans).length > 0;
    const { handleSubmission } = usePayment();
    const { isLoading, countryData } = useGetCountry();
    const { isRegionLoading, regionData, regions } = useGetRegions(travelType === 'regional');
    const { md } = useScreenSize();
    const dispatch = useAppDispatch();
    const pendingSelections = useAppSelector(state => state.reducer.esim.pendingSelections);

    useEffect(() => {
        if (!selectedCountry.length) {
            setActiveCountry(null);
            return;
        }
        if (!activeCountry || !selectedCountry.includes(activeCountry)) {
            setActiveCountry(selectedCountry[0]);
        }
    }, [selectedCountry, activeCountry]);

    useEffect(() => {
        if (travelType === 'single' && selectedCountry.length > 1) {
            setSelectedCountry([]);
            setSelectedPlans({});
        }
    }, [travelType, selectedCountry]);

    useEffect(() => {
        if (shouldScrollToSummary && orderSummaryRef.current) {
            orderSummaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setShouldScrollToSummary(false);
        }
    }, [shouldScrollToSummary]);

    useEffect(() => {
        if (!pendingSelections) return;
        setTravelType(pendingSelections.travelType);
        setSelectedCountry(pendingSelections.selectedCountry);
        setCountryCodes(pendingSelections.countryCodes);
        setSelectedPlans(pendingSelections.selectedPlans);
        setQuantities(pendingSelections.quantities);
        if (pendingSelections.purchasingFor) {
            setPurchasingFor(pendingSelections.purchasingFor);
        }
        dispatch(clearPendingSelections());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animation,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };

    const handleCountryChange = (value: any) => {
        let countries: string[] = [];
        const codes: Record<string, string> = {};

        if (Array.isArray(value)) {
            value.forEach(v => {
                countries.push(v.label);
                codes[v.label] = v.value;
            });
        } else if (value) {
            countries = [value.label];
            codes[value.label] = value.value;
        }

        setSelectedCountry(countries);
        setCountryCodes(codes);

        setQuantities(prev => {
            const next: QuantityMap = {};

            countries.forEach(country => {
                next[country] = prev[country] ?? 1;
            });

            return next;
        });
    };

    const handlePlanClick = (country: string, plan: any) => {
        const nextSelectedPlans = { ...selectedPlans, [country]: plan };
        setSelectedPlans(nextSelectedPlans);

        const currentIndex = selectedCountry.indexOf(country);
        const nextCountry = selectedCountry[currentIndex + 1];

        if (nextCountry) {
            setActiveCountry(nextCountry);
        } else {
            setActiveCountry(null);
        }

        // Only reveal the Order Summary once every selected country has a plan chosen.
        // For single-country travel this is satisfied by the one selection; for multi-country
        // we wait until plans are picked for all countries before scrolling.
        const allCountriesHavePlan =
            selectedCountry.length > 0 &&
            selectedCountry.every(c => Boolean(nextSelectedPlans[c]));

        if (allCountriesHavePlan) {
            setShouldScrollToSummary(true);
        }
    };

    const handlePayment = () => {
        const orders = selectedCountry.map(country => {
            const plan = selectedPlans[country];
            const qty = quantities[country] ?? 1;

            return {
                country,
                countryCode: countryCodes[country],
                data: plan.dataGB * 1024,
                validity: plan.validityDays,
                quantity: qty,
            };
        });

        const isForRecipient = purchasingFor.type !== 'self';
        if (isForRecipient) {
            const recipientName = purchasingFor.name.trim();
            const recipientEmail = purchasingFor.email.trim();
            if (purchasingFor.type === 'employee' && !purchasingFor.employeeId) {
                dispatch(
                    showToast({ description: 'Please select an employee', variant: 'error' })
                );
                return;
            }
            if (!recipientName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
                dispatch(
                    showToast({
                        description:
                            purchasingFor.type === 'employee'
                                ? 'Selected employee has no valid email in payroll'
                                : "Please enter the recipient's full name and a valid email",
                        variant: 'error',
                    })
                );
                return;
            }
        }

        dispatch(setPendingSelections({ travelType, selectedCountry, countryCodes, selectedPlans, quantities, purchasingFor }));
           if (typeof Moengage?.track_event === 'function') {
            const serviceDetails =
                orders.length === 1
                    ? {
                          country: orders[0].country,
                          validity: orders[0].validity,
                          data_pack: `${convertMBtoGB(orders[0].data)}GB`,
                          quantity: orders[0].quantity,
                      }
                    : {
                          countries: orders.map(o => o.country),
                          validity: orders.map(o => o.validity),
                          data_packs: orders.map(o => `${convertMBtoGB(o.data)}GB`),
                          quantities: orders.map(o => o.quantity),
                      };
            Moengage.track_event('esim_buy_now_IN', serviceDetails);
            sessionStorage.setItem('service_details', JSON.stringify({ serviceDetails }));
        }
        handleSubmission({
            orders,
            ...(isForRecipient && {
                purchasingFor: {
                    ...purchasingFor,
                    name: purchasingFor.name.trim(),
                    email: purchasingFor.email.trim(),
                },
            }),
        });
    };

    const isBuyDisabled =
        selectedCountry.length === 0 ||
        selectedCountry.some(country => {
            const planMissing = !selectedPlans[country];
            const qty = quantities[country] ?? 0;
            return planMissing || qty <= 0;
        });

    const handleQuantityChange = (country: string, qty: number) => {
        setQuantities(prev => ({
            ...prev,
            [country]: qty,
        }));
    };

    const handleTravelTypeChange = (nextTravelType: TravelType) => {
        if (nextTravelType === travelType) return;

        setTravelType(nextTravelType);
        setSelectedCountry([]);
        setCountryCodes({});
        setSelectedPlans({});
        setQuantities({});
        setActiveCountry(null);
    };

    let selectedDestinationValue;
    if (travelType === 'multi') {
        selectedDestinationValue = selectedCountry.map(country => ({
            label: country,
            value: countryCodes[country],
        }));
    } else if (selectedCountry[0]) {
        selectedDestinationValue = {
            label: selectedCountry[0],
            value: countryCodes[selectedCountry[0]],
        };
    }

    return (
        <>
            {!countryData || isLoading ? (
                <Flex justify="center" align="middle" className="w-full h-full min-h-[300px]">
                    <Lottie
                        options={defaultOptions}
                        height="100%"
                        width="100%"
                        isClickToPauseDisabled
                        style={{ maxWidth: '400px', maxHeight: '300px' }}
                    />
                </Flex>
            ) : (
                <Row gutter={[28, 28]} className="esim-home-page">
                    <Col xs={24}>
                        <Flex vertical gap={16} className="pt-2 sm:pt-4">
                            <Row gutter={[10, 10]} align="middle">
                                <Col span={24} sm={16}>
                                    <Text className="block font-medium text-2xl sm:text-3xl mt-2">
                                        Float by Peko
                                    </Text>

                                    <Text className="block font-normal text-lg sm:text-xl text-thin mt-2 mb-2">
                                        Save huge costs on roaming data. Get an activated eSIM
                                        instantly
                                    </Text>
                                </Col>
                                <Col span={24} sm={8}>
                                    <Flex justify="end" gap={12} wrap="wrap">
                                        <Link to={links[3]}>
                                            <Button
                                                danger
                                                ghost
                                                className="esim-outline-action-btn"
                                            >
                                                Order History
                                            </Button>
                                        </Link>
                                    </Flex>
                                </Col>
                            </Row>
                        </Flex>
                    </Col>
                    <Col
                        span={24}
                        sm={14}
                        md={7}
                        lg={6}
                        xl={5}
                        xxl={5}
                        className="w-full flex justify-center md:justify-start"
                    >
                        <div className="esim-hero-image-wrap">
                            {md ? (
                                <Image
                                    src={DefaultImage}
                                    preview={false}
                                    className="esim-hero-image"
                                />
                            ) : (
                                <Image
                                    src={DefaultImageSm}
                                    preview={false}
                                    className="esim-hero-image"
                                />
                            )}
                        </div>
                    </Col>
                    <Col span={24} md={17} lg={18} xl={19} xxl={19}>
                        <Row gutter={[24, 24]} align="top">
                            <Col span={24} lg={15} xl={16}>
                                <Flex vertical gap={24} className="w-full mt-3">
                                    <TravelTypeSelector
                                        value={travelType}
                                        onChange={handleTravelTypeChange}
                                    />

                                    <div className="py-2">
                                        <Space align="center" className="mb-3">
                                            <IoLocationOutline
                                                className="text-red-500"
                                                style={{ fontSize: 18 }}
                                            />
                                            <Text strong className="text-[17px]">
                                                Select Destination
                                            </Text>
                                        </Space>

                                        <div className="esim-destination-label">
                                            {travelType === 'regional'
                                                ? 'Coverage — one eSIM covers every country in the region'
                                                : 'Coverage'}
                                        </div>

                                        <Select
                                            key={travelType}
                                            showSearch
                                            className="w-full esim-destination-select"
                                            placeholder={
                                                travelType === 'regional'
                                                    ? 'Select region'
                                                    : 'Select country / countries'
                                            }
                                            loading={travelType === 'regional' && isRegionLoading}
                                            suffixIcon={
                                                selectedDestinationValue ? null : (
                                                    <span
                                                        className="esim-destination-select-icon"
                                                        style={
                                                            travelType === 'single'
                                                                ? {
                                                                      position: 'relative',
                                                                      top: '2px',
                                                                  }
                                                                : undefined
                                                        }
                                                    >
                                                        <DownOutlined />
                                                    </span>
                                                )
                                            }
                                            labelInValue
                                            allowClear
                                            optionFilterProp="label"
                                            onChange={handleCountryChange}
                                            value={selectedDestinationValue}
                                            options={
                                                travelType === 'regional'
                                                    ? regionData
                                                    : countryData
                                            }
                                            mode={travelType === 'multi' ? 'multiple' : undefined}
                                            maxCount={travelType === 'multi' ? 5 : undefined}
                                            size="large"
                                        />
                                    </div>

                                    {travelType === 'regional' && selectedCountry[0] && (
                                        <RegionCoverage
                                            regionLabel={selectedCountry[0]}
                                            countries={
                                                regions?.find(
                                                    r =>
                                                        r.code ===
                                                        countryCodes[selectedCountry[0]]
                                                )?.countries ?? []
                                            }
                                        />
                                    )}

                                    <PurchasingForSelector
                                        value={purchasingFor}
                                        onChange={setPurchasingFor}
                                    />

                                    <Collapse
                                        accordion
                                        ghost
                                        className="esim-country-collapse"
                                        expandIconPosition="end"
                                        activeKey={activeCountry ?? undefined}
                                        onChange={key => {
                                            const active = Array.isArray(key) ? key[0] : key;
                                            setActiveCountry(active ?? null);
                                        }}
                                    >
                                        {selectedCountry.map(country => (
                                            <Collapse.Panel
                                                key={country}
                                                header={
                                                    <Space align="center" size={10}>
                                                        <MobileOutlined
                                                            className="text-red-500"
                                                            style={{ fontSize: 16 }}
                                                        />
                                                        <Text
                                                            strong
                                                            className="text-[17px]"
                                                        >{`Choose Your Plan For ${country}`}</Text>
                                                    </Space>
                                                }
                                                className="esim-country-panel"
                                            >
                                                <CountryPlansBlock
                                                    country={country}
                                                    regionCode={
                                                        travelType === 'regional'
                                                            ? countryCodes[country]
                                                            : undefined
                                                    }
                                                    selectedPlan={selectedPlans[country]}
                                                    quantity={quantities[country] ?? 1}
                                                    onQuantityChange={handleQuantityChange}
                                                    onSelectPlan={handlePlanClick}
                                                />
                                            </Collapse.Panel>
                                        ))}
                                    </Collapse>
                                </Flex>
                            </Col>
                            {hasSelectedPlan && (
                                <Col span={24} lg={9} xl={8}>
                                    <div ref={orderSummaryRef} className="sticky top-24">
                                        <OrderSummaryCard
                                            countries={selectedCountry}
                                            quantities={quantities}
                                            selectedPlans={selectedPlans}
                                            onBuyNow={handlePayment}
                                            disabled={isBuyDisabled}
                                        />
                                    </div>
                                </Col>
                            )}
                        </Row>
                    </Col>
                    <Col span={24}>
                        <Row>
                            <Col span={24} lg={17} xl={18} xxl={18}>
                                <About />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            )}
        </>
    );
};

export default Home;
