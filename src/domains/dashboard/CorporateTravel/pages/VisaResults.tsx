import { useEffect, useState } from 'react';

import { Button, Card, Col, Divider, Flex, InputNumber, Row, Skeleton, Spin, Typography, notification } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import AirplaneIcon from '@domains/dashboard/CorporateTravel/assets/images/airplane.png';
import DestinationIcon from '@domains/dashboard/CorporateTravel/assets/images/destination.png';
import ProfileIcon from '@domains/dashboard/CorporateTravel/assets/images/profile.png';
import { paths } from '@src/routes/paths';

import VisaProgressSteps from '../components/VisaProgressSteps';
import { useCountryFlags, useVisaProductDocuments, useVisaSearch } from '../hooks/useVisaApi';
import { type VisaOption } from '../utils/data';

const { Text, Title } = Typography;

const MAX_TRAVELLERS_PER_TYPE = 50;

const clampTravellerCount = (value: number | null, min = 0) =>
    Math.min(Math.max(Math.trunc(value ?? 0), min), MAX_TRAVELLERS_PER_TYPE);

const parseTravellerInput = (displayValue: string | undefined) =>
    Number((displayValue ?? '').replace(/[^\d]/g, '')) || 0;

const blockTravellerBounds = (min: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/^[0-9]$/.test(e.key)) return;
    const { value, selectionStart, selectionEnd } = e.currentTarget;
    const nextValue = `${value.slice(0, selectionStart ?? 0)}${e.key}${value.slice(selectionEnd ?? value.length)}`;
    const numeric = Number(nextValue);
    if (numeric > MAX_TRAVELLERS_PER_TYPE || numeric < min) {
        e.preventDefault();
    }
};

interface TravellerCount {
    adults: number;
    children: number;
    infants: number;
}

const VisaCard = ({
    visa,
    travellers,
    expanded,
    onSelect,
    documents,
    isRefreshing = false,
}: {
    visa: VisaOption;
    travellers: TravellerCount;
    expanded: boolean;
    onSelect: () => void;
    documents?: string[];
    isRefreshing?: boolean;
}) => {
    const hasEmbassyPayment = visa.breakupComponents.some(
        c => c.remark && c.remark.trim() !== '' && c.remark !== 'null'
    );
    const embassyRemark = visa.breakupComponents.find(
        c => c.remark && c.remark.trim() !== '' && c.remark !== 'null'
    )?.remark ?? '';
    const serviceChargesTotal = visa.breakupServiceFee + visa.breakupTaxServiceFee;

    return (
        <Card
            className="transition-all"
            style={{
                borderRadius: 24,
                boxShadow: '0px 1.23646px 12.3646px 1.1379px rgba(0, 0, 0, 0.06)',
                borderWidth: expanded ? 1.5 : 1,
                borderColor: expanded ? '#FF4F4F' : 'transparent',
            }}
            styles={{ body: { padding: '28px 29px' } }}
        >
            <Flex
                justify="space-between"
                align="start"
                wrap="wrap"
                gap={12}
                className="cursor-pointer"
                onClick={onSelect}
            >
                <Flex align="center" gap={16}>
                    <Flex
                        vertical
                        align="center"
                        justify="center"
                        className="w-14 h-14 rounded-xl bg-red-50 shrink-0"
                    >
                        <Text className="text-xl font-semibold text-[#FF4F4F] leading-none">
                            {visa.days}
                        </Text>
                        <Text className="text-[10px] text-[#FF4F4F]">Days</Text>
                    </Flex>
                    <Flex vertical gap={3}>
                        <Text style={{ fontWeight: 600, fontSize: 20, lineHeight: '29px', color: '#000000' }}>{visa.name}</Text>
                        <Text style={{ fontWeight: 400, fontSize: 14, lineHeight: '29px', color: '#000000' }}>
                            {visa.entryType} · {visa.processingTime}
                        </Text>
                    </Flex>
                </Flex>
                <Flex vertical align="end" style={{ flexShrink: 0 }}>
                    <Text className="text-[10px] text-gray-400">Price</Text>
                    {isRefreshing ? (
                        <Skeleton.Input active size="small" style={{ width: 90, marginTop: 4 }} />
                    ) : (
                        <>
                            <Text className="text-lg font-semibold">₹{visa.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                            <Text className="text-[10px] text-gray-400">
                                incl. taxes · ₹{visa.pricePerPerson.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/person
                            </Text>
                        </>
                    )}
                </Flex>
            </Flex>

            {expanded && (
                <Flex vertical className="mt-5 pt-5 border-t border-gray-100">
                    <Row gutter={[32, 24]}>
                        <Col xs={24} md={12}>
                            <Flex vertical gap={16}>
                                <Flex vertical gap={4}>
                                    <Text className="font-semibold text-sm block mb-1">
                                        Visa Info
                                    </Text>
                                    <Text className="text-xs text-gray-500">{visa.visaInfo}</Text>
                                </Flex>
                                <Flex vertical gap={4}>
                                    <Text className="font-semibold text-sm block mb-2">
                                        Required Documents
                                    </Text>
                                    <Flex vertical gap={4}>
                                        {(documents ?? visa.requiredDocuments).map(doc => (
                                            <Flex key={doc} align="start" gap={6}>
                                                <Text className="text-[#05BE63] text-xs mt-0.5">
                                                    ✓
                                                </Text>
                                                <Text className="text-xs text-gray-500">{doc}</Text>
                                            </Flex>
                                        ))}
                                    </Flex>
                                </Flex>
                            </Flex>
                        </Col>
                        <Col xs={24} md={12}>
                            {isRefreshing ? (
                                <Skeleton active paragraph={{ rows: 6 }} />
                            ) : (
                            <Flex vertical gap={12}>
                                <Flex justify="space-between" align="center">
                                    <Text className="font-semibold text-sm">Total Visa Cost</Text>
                                    <Text className="text-xl font-bold text-[#FF4F4F]">
                                        ₹{visa.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                </Flex>

                                {/* Government Fees */}
                                <Card
                                    className="rounded-xl bg-gray-50 border-gray-100"
                                    styles={{ body: { padding: '14px 16px' } }}
                                >
                                    <Flex justify="space-between" align="center" className="mb-1">
                                        <Text className="font-semibold text-xs">
                                            {hasEmbassyPayment ? 'Government Fees — Pay Later' : 'Government Fees'}
                                        </Text>
                                        <Text className="text-sm font-bold">
                                            ₹{visa.totalGovtFees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Text>
                                    </Flex>
                                    {hasEmbassyPayment && (
                                        <Text className="text-[11px] text-[#FF4F4F] block mb-3">
                                            {embassyRemark}
                                        </Text>
                                    )}
                                    <Flex vertical gap={6} className="mt-3">
                                        {visa.breakupComponents.map(c => (
                                            <Flex key={c.component_id} justify="space-between">
                                                <Text className="text-xs text-gray-500">
                                                    {['service fee', 'service fees'].includes(
                                                        c.component.trim().toLowerCase()
                                                    )
                                                        ? 'Embassy Processing Fee'
                                                        : c.component}
                                                </Text>
                                                <Text className="text-xs">₹{c.original_cost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                            </Flex>
                                        ))}
                                    </Flex>
                                </Card>

                                {/* Service Charges */}
                                <Card
                                    className="rounded-xl bg-gray-50 border-gray-100"
                                    styles={{ body: { padding: '14px 16px' } }}
                                >
                                    <Flex justify="space-between" align="center" className="mb-3">
                                        <Text className="font-semibold text-xs">Service Charges</Text>
                                        <Text className="text-sm font-bold">
                                            ₹{serviceChargesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Text>
                                    </Flex>
                                    <Flex vertical gap={6}>
                                        <Flex justify="space-between">
                                            <Text className="text-xs text-gray-500">Service Fees</Text>
                                            <Text className="text-xs">
                                                ₹{visa.breakupServiceFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </Text>
                                        </Flex>
                                        <Flex justify="space-between">
                                            <Text className="text-xs text-gray-500">GST @ 18%</Text>
                                            <Text className="text-xs">
                                                ₹{visa.breakupTaxServiceFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                </Card>

                            </Flex>
                            )}
                        </Col>
                    </Row>
                    <div
                        style={{
                            background: '#FFFDFD',
                            border: '1px solid #F1D3D3',
                            borderRadius: 12,
                            padding: '13px 19px 12px',
                            marginTop: 16,
                        }}
                    >
                        {hasEmbassyPayment ? (
                            <Flex vertical gap={4}>
                                <Text className="text-xs font-semibold">
                                    Step 1: Pay service charges → Application starts
                                </Text>
                                <Text className="text-xs font-semibold">
                                    Step 2: Visit embassy → Pay government fees → Visa issued
                                </Text>
                            </Flex>
                        ) : (
                            <Text className="text-xs font-semibold">
                                All fees are paid upfront — no embassy payment required
                            </Text>
                        )}
                    </div>
                    {hasEmbassyPayment && (
                        <Text className="text-xs text-[#FF4F4F] italic block mt-2">
                            Note: Government fees are not collected by Peko and must be paid directly at the embassy.
                        </Text>
                    )}
                </Flex>
            )}
        </Card>
    );
};

const VisaResults = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as {
        nationality?: string;
        destination?: string;
        destinationId?: number;
        visaType?: string;
        travelDate?: string;
        travellers?: { adults: number; children: number; infants: number };
    } | null;

    const [travellers, setTravellers] = useState<TravellerCount>({
        adults: Math.max(state?.travellers?.adults ?? 1, 1),
        children: state?.travellers?.children ?? 0,
        infants: state?.travellers?.infants ?? 0,
    });

    const [debouncedTravellers, setDebouncedTravellers] = useState<TravellerCount>(travellers);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedTravellers(travellers), 500);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [travellers.adults, travellers.children, travellers.infants]);

    const { docsByProduct, fetchDocuments } = useVisaProductDocuments();

    const { visaOptions, isLoading, selectProduct, supportsChild, supportsInfant, adultAgeLabel, childAgeLabel, infantAgeLabel } = useVisaSearch({
        adult: debouncedTravellers.adults,
        child: debouncedTravellers.children,
        infant: debouncedTravellers.infants,
        destination: state?.destinationId,
        travelDate: state?.travelDate,
        category: state?.visaType,
    });

    useEffect(() => {
        if (!supportsChild && travellers.children > 0) setTravellers(t => ({ ...t, children: 0 }));
        if (!supportsInfant && travellers.infants > 0) setTravellers(t => ({ ...t, infants: 0 }));
    }, [supportsChild, supportsInfant, travellers.children, travellers.infants]);

    const [cachedOptions, setCachedOptions] = useState<VisaOption[]>([]);

    const [selectedVisaId, setSelectedVisaId] = useState<string>('');
    const [selectError, setSelectError] = useState(false);

    useEffect(() => {
        if (visaOptions.length > 0) {
            setCachedOptions(visaOptions);
            if (!selectedVisaId) {
                selectProduct(visaOptions[0]);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visaOptions]);

    const displayOptions = cachedOptions.length > 0 ? cachedOptions : visaOptions;

    const totalTravellers = travellers.adults + travellers.children + travellers.infants;

    const { getFlagImageByName } = useCountryFlags();

    const destinationLabel = state?.destination ?? 'Singapore';
    const destinationFlagImage = getFlagImageByName(destinationLabel);
    const visaTypeLabel = state?.visaType ?? 'Tourist';
    const nationalityLabel = state?.nationality ?? 'India';
    const travelDateStr = state?.travelDate ?? '';

    const travellerLimitExceeded = totalTravellers > MAX_TRAVELLERS_PER_TYPE;

    const handleProceed = () => {
        if (travellerLimitExceeded) return;
        if (totalTravellers === 0) {
            notification.error({ message: 'The number of adult or child travellers must be greater than 0.', placement: 'topRight' });
            return;
        }
        if (displayOptions.length === 0) {
            notification.error({ message: 'No visas are available for the selected traveller details.', placement: 'topRight' });
            return;
        }
        if (!selectedVisaId) {
            setSelectError(true);
            return;
        }
        const selectedVisa = visaOptions.find(v => v.id === selectedVisaId)!;
        navigate(
            `${paths.dashboard.corporateTravel}/${paths.visa.index}/${paths.visa.travellerDetails}`,
            {
                state: {
                    visa: selectedVisa,
                    travellers,
                    destination: destinationLabel,
                    destinationId: state?.destinationId,
                    visaType: visaTypeLabel,
                    nationality: nationalityLabel,
                    travelDate: travelDateStr,
                },
            }
        );
    };

    return (
        <Flex vertical gap={20} className="w-full max-w-5xl mx-auto pb-10">
            {/* Stepper */}
            <VisaProgressSteps currentStep={0} />

            {/* Summary + Travellers (single card) */}
            <Card
                bordered={false}
                style={{
                    borderRadius: 24,
                    boxShadow: '0px 1.23646px 12.3646px 1.1379px rgba(0, 0, 0, 0.06)',
                }}
                styles={{ body: { padding: '28px 29px' } }}
            >
                <Row gutter={[24, 12]} justify="center">
                    <Col xs={24} sm={8} className="text-center">
                        <Text className="text-xs text-black block mb-1">
                            Destination Country
                        </Text>
                        <Flex align="center" justify="center" gap={6} className="mt-3">
                            <Flex
                                align="center"
                                justify="center"
                                className="w-7 h-7 rounded-full shrink-0 overflow-hidden"
                                style={{ backgroundColor: '#FFF4F4' }}
                            >
                                {destinationFlagImage ? (
                                    <div className="w-6 h-6 rounded-full overflow-hidden">
                                        <img
                                            src={destinationFlagImage}
                                            alt="destination"
                                            className="w-full h-full object-cover scale-[2]"
                                        />
                                    </div>
                                ) : (
                                    <img src={DestinationIcon} alt="destination" className="w-4 h-4 object-contain" />
                                )}
                            </Flex>
                            <Text className="font-semibold">{destinationLabel}</Text>
                        </Flex>
                    </Col>
                    <Col xs={24} sm={8} className="text-center">
                        <Text className="text-xs text-black block mb-1">Type of Visa</Text>
                        <Flex align="center" justify="center" gap={6} className="mt-3">
                            <Flex align="center" justify="center" className="w-7 h-7 rounded-full" style={{ backgroundColor: '#FFF4F4' }}>
                                <img src={ProfileIcon} alt="visa type" className="w-4 h-4 object-contain" />
                            </Flex>
                            <Text className="font-semibold">{visaTypeLabel}</Text>
                        </Flex>
                    </Col>
                    <Col xs={24} sm={8} className="text-center">
                        <Text className="text-xs text-black block mb-1">Traveller from</Text>
                        <Flex align="center" justify="center" gap={6} className="mt-3">
                            <Flex align="center" justify="center" className="w-7 h-7 rounded-full" style={{ backgroundColor: '#FFF4F4' }}>
                                <img src={AirplaneIcon} alt="traveller from" className="w-4 h-4 object-contain" />
                            </Flex>
                            <Text className="font-semibold">{nationalityLabel}</Text>
                        </Flex>
                    </Col>
                </Row>

                <Divider className="mt-6 mb-4" />

                <Title level={5} style={{ marginBottom: 16, textAlign: 'center' }}>
                    Number of Travellers
                </Title>
                <Row gutter={[24, 16]} justify="center" className="mt-3">
                    <Col xs={24} sm={8}>
                        <Flex align="center" justify="space-between">
                            <Flex vertical gap={2}>
                                <Text className="font-medium text-sm">Adults</Text>
                                <Text className="text-xs text-gray-400">{adultAgeLabel}</Text>
                            </Flex>
                            <InputNumber
                                min={1}
                                max={MAX_TRAVELLERS_PER_TYPE}
                                precision={0}
                                parser={parseTravellerInput}
                                onKeyDown={blockTravellerBounds(1)}
                                value={travellers.adults}
                                onChange={v => setTravellers(t => ({ ...t, adults: clampTravellerCount(v, 1) }))}
                                size="middle"
                                style={{ width: 90 }}
                            />
                        </Flex>
                    </Col>
                    {supportsChild && (
                        <Col xs={24} sm={8}>
                            <Flex align="center" justify="space-between">
                                <Flex vertical gap={2}>
                                    <Text className="font-medium text-sm">Children</Text>
                                    <Text className="text-xs text-gray-400">{childAgeLabel}</Text>
                                </Flex>
                                <InputNumber
                                    min={0}
                                    max={MAX_TRAVELLERS_PER_TYPE}
                                    precision={0}
                                    parser={parseTravellerInput}
                                    onKeyDown={blockTravellerBounds(0)}
                                    value={travellers.children}
                                    onChange={v => setTravellers(t => ({ ...t, children: clampTravellerCount(v) }))}
                                    size="middle"
                                    style={{ width: 90 }}
                                />
                            </Flex>
                        </Col>
                    )}
                    {supportsInfant && (
                        <Col xs={24} sm={8}>
                            <Flex align="center" justify="space-between">
                                <Flex vertical gap={2}>
                                    <Text className="font-medium text-sm">Infants</Text>
                                    <Text className="text-xs text-gray-400">{infantAgeLabel}</Text>
                                </Flex>
                                <InputNumber
                                    min={0}
                                    max={MAX_TRAVELLERS_PER_TYPE}
                                    precision={0}
                                    parser={parseTravellerInput}
                                    onKeyDown={blockTravellerBounds(0)}
                                    value={travellers.infants}
                                    onChange={v => setTravellers(t => ({ ...t, infants: clampTravellerCount(v) }))}
                                    size="middle"
                                    style={{ width: 90 }}
                                />
                            </Flex>
                        </Col>
                    )}
                </Row>
            </Card>

            {/* Available Visas */}
            <Flex vertical gap={12}>
                <Text className="font-semibold text-base">
                    Available Visas — {totalTravellers} traveller{totalTravellers !== 1 ? 's' : ''}
                </Text>
                {(() => {
                    if (isLoading && !selectedVisaId) {
                        return (
                            <Flex justify="center" align="center" className="py-10">
                                <Spin size="large" />
                            </Flex>
                        );
                    }
                    if (displayOptions.length === 0) {
                        return (
                            <Text className="text-sm text-gray-500">
                                No visas are available for the selected traveller details. Please go back and select a different visa option.
                            </Text>
                        );
                    }
                    return displayOptions.map(visa => (
                        <VisaCard
                            key={visa.id}
                            visa={visa}
                            travellers={travellers}
                            expanded={visa.id === selectedVisaId}
                            isRefreshing={isLoading}
                            documents={docsByProduct[visa.productId]}
                            onSelect={() => {
                                if (selectedVisaId === visa.id) {
                                    setSelectedVisaId('');
                                } else {
                                    setSelectedVisaId(visa.id);
                                    setSelectError(false);
                                    selectProduct(visa);
                                    fetchDocuments(visa.productId);
                                    // PROTOTYPE-SETUP: MoEngage analytics call removed (SDK stripped).
                                }
                            }}
                        />
                    ));
                })()}
            </Flex>

            {selectError && displayOptions.length > 0 && (
                <Text style={{ color: '#ff4d4f', fontSize: 13 }}>
                    Please select a visa plan before proceeding.
                </Text>
            )}

            {/* Footer Actions */}
            <Flex justify="flex-end" gap={12} wrap="wrap" className="pt-2">
                <Button
                    type="primary"
                    size="large"
                    className="w-full sm:w-auto"
                    style={{ backgroundColor: '#FF4F4F', borderColor: '#FF4F4F' }}
                    onClick={handleProceed}
                    disabled={travellerLimitExceeded}
                >
                    Proceed to Traveller Details
                </Button>
                <Button
                    size="large"
                    className="w-full sm:w-auto"
                    onClick={() =>
                        navigate(paths.dashboard.corporateTravel, { state: { tab: '4' } })
                    }
                    style={{ borderColor: '#FF4F4F', color: '#FF4F4F' }}
                >
                    Go back
                </Button>
            </Flex>
        </Flex>
    );
};

export default VisaResults;
