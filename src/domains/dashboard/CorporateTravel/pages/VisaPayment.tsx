import { useEffect, useState } from 'react';

import { Button, Card, Col, Divider, Flex, Input, Row, Typography } from 'antd';
import { useLocation } from 'react-router-dom';

import VisaProgressSteps from '../components/VisaProgressSteps';
import { useVisaAddOns, useVisaPayment } from '../hooks/useVisaApi';
import { type StagedVisaDocument, type VisaBreakup, type VisaProduct } from '../types/visa';
import { type VisaOption } from '../utils/data';

const { Text, Title } = Typography;

const VisaPayment = () => {
    const location = useLocation();
    const state = location.state as {
        visa?: VisaOption;
        travellers?: { adults: number; children: number; infants: number };
        destination?: string;
        destinationId?: number;
        visaType?: string;
        travelDate?: string;
        visaBaseAmount?: number;
        productBreakup?: {
            breakup: VisaBreakup;
            age_cost_breakup: VisaProduct['age_cost_breakup'];
        };
        companyName?: string;
        billingEmail?: string;
        phoneNumber?: string;
        billingAddressLine1?: string;
        billingAddressLine2?: string;
        billingCity?: string;
        billingState?: string;
        billingPincode?: string;
        passengers?: Array<{
            firstName: string;
            lastName: string;
            passportNo: string;
            dob: string;
            type: string;
            contactNumber?: string;
            stagedDocuments?: StagedVisaDocument[];
        }>;
    } | null;

    const { initiatePayment } = useVisaPayment();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- unused while Add-on Services UI is hidden, see below
    const { addOns, isLoading: addOnsLoading } = useVisaAddOns(state?.destinationId ?? null);
    const [isPaying, setIsPaying] = useState(false);

    const ADD_ON_SERVICES = addOns.map(a => ({
        key: a.name,
        label: a.name,
        desc: a.description,
        price: a.price,
        flat: a.price_type === 'flat_fee',
    }));

    const visa = state?.visa ?? null;
    const travellers = state?.travellers ?? { adults: 1, children: 0, infants: 0 };

    // `travellers` reflects the counts at the time the visa was first selected — passengers can be
    // added/removed afterwards on the Travellers Details page, so the current passenger list (when
    // available) is the source of truth for how many people are actually being paid for.
    const actualAdults = state?.passengers
        ? state.passengers.filter(p => p.type === 'adult').length
        : travellers.adults;
    const actualChildren = state?.passengers
        ? state.passengers.filter(p => p.type === 'child').length
        : travellers.children;
    const actualInfants = state?.passengers
        ? state.passengers.filter(p => p.type === 'infant').length
        : travellers.infants;
    const totalTravellers = actualAdults + actualChildren + actualInfants;

    // `visa.price`/`visa.totalPayNow` and its cost breakdown were computed for the original adult
    // count searched on the results page. `visaBaseAmount` (set on the Travellers Details page) is
    // recalculated for the current passenger list, so derive a scale factor from it and apply it to
    // every priced figure below to keep the itemised breakdown consistent with the displayed total.
    const priceScaleFactor =
        state?.visaBaseAmount !== undefined && visa?.price ? state.visaBaseAmount / visa.price : 1;

    const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
    const [companyName, setCompanyName] = useState(state?.companyName ?? '');
    const [billingEmail, setBillingEmail] = useState(state?.billingEmail ?? '');
    const [phoneNumber, setPhoneNumber] = useState(state?.phoneNumber ?? '');
    const [billingErrors, setBillingErrors] = useState<Record<string, string>>({});

    const billingAddress = [
        state?.billingAddressLine1,
        state?.billingAddressLine2,
        state?.billingCity,
        state?.billingState,
        state?.billingPincode,
    ]
        .filter(Boolean)
        .join(', ');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- unused while Add-on Services UI is hidden, see below
    const toggleAddon = (key: string) => {
        setSelectedAddOns(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const addonTotal = ADD_ON_SERVICES.filter(a => selectedAddOns.has(a.key)).reduce(
        (sum, a) => sum + (a.flat ? a.price : a.price * totalTravellers),
        0
    );

    const hasEmbassyPayment = (visa?.breakupComponents ?? []).some(
        c => c.remark && c.remark.trim() !== '' && c.remark !== 'null'
    );

    // Full payment: collect total visa cost (govt fees + service charges)
    // Partial payment: collect only service charges now; govt fees paid at embassy
    const payNow =
        (hasEmbassyPayment ? (visa?.totalPayNow ?? 0) : (visa?.price ?? 0)) * priceScaleFactor +
        addonTotal;

    useEffect(() => {
        // PROTOTYPE-SETUP: MoEngage analytics call removed (SDK stripped).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Flex vertical gap={20} className="w-full pb-10">
            {/* Stepper */}
            <VisaProgressSteps currentStep={2} />

            {/* Two-column layout */}
            <Row gutter={[16, 20]} align="top">
                {/* Left column — main content */}
                <Col xs={24} md={15} lg={16}>
                    <Flex vertical gap={20}>
                        {/* Application Summary */}
                        {visa && (
                            <Card
                                bordered={false}
                                style={{
                                    borderRadius: 24,
                                    boxShadow:
                                        '0px 1.23646px 12.3646px 1.1379px rgba(0, 0, 0, 0.06)',
                                }}
                                styles={{ body: { padding: '28px 29px' } }}
                            >
                                <Title
                                    level={5}
                                    style={{
                                        marginBottom: 0,
                                        fontWeight: 600,
                                        fontSize: 20,
                                        letterSpacing: -0.45,
                                        color: '#0A0A0A',
                                    }}
                                >
                                    Application Summary
                                </Title>
                                <Row gutter={[24, 20]} style={{ marginTop: 18 }}>
                                    <Col xs={24} sm={8}>
                                        <Flex vertical gap={9}>
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 400,
                                                    letterSpacing: '0.03em',
                                                    color: '#969696',
                                                    lineHeight: '16px',
                                                }}
                                            >
                                                Visa
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 16,
                                                    fontWeight: 500,
                                                    color: '#070707',
                                                    lineHeight: '19px',
                                                }}
                                            >
                                                {visa.name}
                                            </Text>
                                        </Flex>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Flex vertical gap={9}>
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 400,
                                                    letterSpacing: '0.03em',
                                                    color: '#969696',
                                                    lineHeight: '16px',
                                                }}
                                            >
                                                Duration
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 16,
                                                    fontWeight: 500,
                                                    color: '#070707',
                                                    lineHeight: '19px',
                                                }}
                                            >
                                                {visa.days} Days
                                            </Text>
                                        </Flex>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Flex vertical gap={9}>
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 400,
                                                    letterSpacing: '0.03em',
                                                    color: '#969696',
                                                    lineHeight: '16px',
                                                }}
                                            >
                                                Entry Type
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 16,
                                                    fontWeight: 500,
                                                    color: '#070707',
                                                    lineHeight: '19px',
                                                }}
                                            >
                                                {visa.entryType}
                                            </Text>
                                        </Flex>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Flex vertical gap={9}>
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 400,
                                                    letterSpacing: '0.03em',
                                                    color: '#969696',
                                                    lineHeight: '16px',
                                                }}
                                            >
                                                Processing
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 16,
                                                    fontWeight: 500,
                                                    color: '#070707',
                                                    lineHeight: '19px',
                                                }}
                                            >
                                                {visa.processingTime}
                                            </Text>
                                        </Flex>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Flex vertical gap={9}>
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 400,
                                                    letterSpacing: '0.03em',
                                                    color: '#969696',
                                                    lineHeight: '16px',
                                                }}
                                            >
                                                Travellers
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 16,
                                                    fontWeight: 500,
                                                    color: '#070707',
                                                    lineHeight: '19px',
                                                }}
                                            >
                                                {totalTravellers} ({actualAdults}A {actualChildren}C{' '}
                                                {actualInfants}I)
                                            </Text>
                                        </Flex>
                                    </Col>
                                </Row>
                            </Card>
                        )}

                        {/* Travellers */}
                        {state?.passengers && state.passengers.length > 0 && (
                            <Card
                                bordered={false}
                                style={{
                                    borderRadius: 24,
                                    boxShadow:
                                        '0px 1.23646px 12.3646px 1.1379px rgba(0, 0, 0, 0.06)',
                                }}
                                styles={{ body: { padding: '28px 29px' } }}
                            >
                                <Title
                                    level={5}
                                    style={{
                                        marginBottom: 16,
                                        fontWeight: 600,
                                        fontSize: 20,
                                        letterSpacing: -0.45,
                                        color: '#0A0A0A',
                                    }}
                                >
                                    Travellers
                                </Title>
                                <Flex vertical gap={12}>
                                    {state.passengers.map((p, i) => {
                                        const initials =
                                            `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase();
                                        return (
                                            <Flex
                                                key={i}
                                                align="center"
                                                justify="space-between"
                                                style={{ padding: '10px 0' }}
                                            >
                                                <Flex align="center" gap={16}>
                                                    <Flex
                                                        align="center"
                                                        justify="center"
                                                        style={{
                                                            width: 72,
                                                            height: 72,
                                                            borderRadius: '50%',
                                                            background: '#FFEEEE',
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontWeight: 600,
                                                                fontSize: 20,
                                                                color: '#FF4F4F',
                                                            }}
                                                        >
                                                            {initials}
                                                        </Text>
                                                    </Flex>
                                                    <Flex vertical gap={4}>
                                                        <Text
                                                            style={{
                                                                fontWeight: 500,
                                                                fontSize: 16,
                                                                lineHeight: '22px',
                                                                letterSpacing: -0.45,
                                                                color: '#0A0A0A',
                                                            }}
                                                        >
                                                            {p.firstName} {p.lastName}
                                                        </Text>
                                                        <Text
                                                            style={{ fontSize: 13, color: '#888' }}
                                                        >
                                                            Passport: {p.passportNo} · DOB: {p.dob}
                                                        </Text>
                                                    </Flex>
                                                </Flex>
                                                <Flex
                                                    align="center"
                                                    justify="center"
                                                    style={{
                                                        background: '#E3F6ED',
                                                        borderRadius: 39,
                                                        padding: '6px 16px',
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 13,
                                                            fontWeight: 500,
                                                            color: '#16A34A',
                                                        }}
                                                    >
                                                        ✓ Docs
                                                    </Text>
                                                </Flex>
                                            </Flex>
                                        );
                                    })}
                                </Flex>
                            </Card>
                        )}

                        {/* Add-on Services — hidden until vendor exposes the required APIs */}
                        {/* <Card
                            bordered={false}
                            style={{
                                borderRadius: 24,
                                boxShadow: '0px 1.23646px 12.3646px 1.1379px rgba(0, 0, 0, 0.06)',
                            }}
                            styles={{ body: { padding: '28px 29px' } }}
                        >
                            <Title level={5} style={{ marginBottom: 4, fontWeight: 500 }}>Add-on Services</Title>
                            <Text className="text-xs text-gray-400 block mb-4">
                                Enhance your application with optional services
                            </Text>
                            {addOnsLoading ? (
                                <Skeleton active paragraph={{ rows: 5 }} />
                            ) : (
                            <Flex vertical gap={14}>
                                {ADD_ON_SERVICES.map(addon => (
                                    <Flex key={addon.key} align="start" justify="space-between">
                                        <Flex align="start" gap={10}>
                                            <Checkbox
                                                checked={selectedAddOns.has(addon.key)}
                                                onChange={() => toggleAddon(addon.key)}
                                                style={{ marginTop: 2 }}
                                            />
                                            <Flex vertical>
                                                <Text className="font-semibold text-sm">{addon.label}</Text>
                                                <Text className="text-xs font-semibold" style={{ color: '#000000' }}>{addon.desc}</Text>
                                            </Flex>
                                        </Flex>
                                        <Flex vertical align="end" className="shrink-0 ml-4">
                                            <Text className="text-sm font-semibold" style={{ color: '#000000' }}>
                                                ₹{Number(addon.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </Text>
                                            <Text className="text-xs font-semibold" style={{ color: '#000000' }}>
                                                {addon.flat ? 'flat fee' : `₹${Number(addon.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/person`}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                ))}
                            </Flex>
                            )}
                        </Card> */}

                        {/* Billing Details */}
                        <Card
                            bordered={false}
                            style={{
                                borderRadius: 24,
                                boxShadow: '0px 1.23646px 12.3646px 1.1379px rgba(0, 0, 0, 0.06)',
                            }}
                            styles={{ body: { padding: '28px 29px 4px' } }}
                        >
                            <Title level={5} style={{ marginBottom: 16, fontWeight: 500 }}>
                                Billing Details
                            </Title>
                            <Row gutter={[21, 0]}>
                                <Col xs={24} sm={12}>
                                    <Flex vertical gap={4} style={{ marginBottom: 24 }}>
                                        <Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)' }}>
                                            Company Name
                                        </Text>
                                        <Input
                                            placeholder="Eg. Peko Payments"
                                            value={companyName}
                                            onChange={e => {
                                                setCompanyName(e.target.value);
                                                if (e.target.value.trim())
                                                    setBillingErrors(prev => ({
                                                        ...prev,
                                                        companyName: '',
                                                    }));
                                            }}
                                            onBlur={() => {
                                                if (!companyName.trim())
                                                    setBillingErrors(prev => ({
                                                        ...prev,
                                                        companyName:
                                                            'Please enter the company name',
                                                    }));
                                                else if (companyName !== companyName.trim())
                                                    setBillingErrors(prev => ({
                                                        ...prev,
                                                        companyName:
                                                            'Company name cannot start or end with spaces',
                                                    }));
                                                else if (companyName.trim().length < 3)
                                                    setBillingErrors(prev => ({
                                                        ...prev,
                                                        companyName:
                                                            'Company name must be at least 3 characters',
                                                    }));
                                                else if (companyName.trim().length > 100)
                                                    setBillingErrors(prev => ({
                                                        ...prev,
                                                        companyName:
                                                            'Company name must not exceed 100 characters',
                                                    }));
                                                else if (!/[a-zA-Z]/.test(companyName))
                                                    setBillingErrors(prev => ({
                                                        ...prev,
                                                        companyName:
                                                            'Company name cannot contain numbers only',
                                                    }));
                                                else if (
                                                    !/^[a-zA-Z0-9 \-&]+$/.test(companyName.trim())
                                                )
                                                    setBillingErrors(prev => ({
                                                        ...prev,
                                                        companyName:
                                                            'Please enter a valid company name using letters, numbers, spaces, - and &',
                                                    }));
                                            }}
                                            status={billingErrors.companyName ? 'error' : undefined}
                                            style={{ height: 40, borderRadius: 8 }}
                                        />
                                        {billingErrors.companyName && (
                                            <Text style={{ color: '#ff4d4f', fontSize: 12 }}>
                                                {billingErrors.companyName}
                                            </Text>
                                        )}
                                    </Flex>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Flex vertical gap={4} style={{ marginBottom: 24 }}>
                                        <Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)' }}>
                                            Billing Email
                                        </Text>
                                        <Input
                                            placeholder="Eg. billing@company.com"
                                            type="text"
                                            value={billingEmail}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setBillingEmail(val);
                                                if (!val.trim())
                                                    setBillingErrors(prev => ({
                                                        ...prev,
                                                        billingEmail: '',
                                                    }));
                                                else if (val !== val.trim())
                                                    setBillingErrors(prev => ({
                                                        ...prev,
                                                        billingEmail:
                                                            'Billing email cannot start or end with spaces',
                                                    }));
                                                else
                                                    setBillingErrors(prev => ({
                                                        ...prev,
                                                        billingEmail: '',
                                                    }));
                                            }}
                                            onBlur={() => {
                                                if (!billingEmail.trim())
                                                    setBillingErrors(prev => ({
                                                        ...prev,
                                                        billingEmail:
                                                            'Please enter the billing email',
                                                    }));
                                                else if (billingEmail !== billingEmail.trim())
                                                    setBillingErrors(prev => ({
                                                        ...prev,
                                                        billingEmail:
                                                            'Billing email cannot start or end with spaces',
                                                    }));
                                                else if (
                                                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                                        billingEmail.trim()
                                                    )
                                                )
                                                    setBillingErrors(prev => ({
                                                        ...prev,
                                                        billingEmail: 'Please enter a valid email',
                                                    }));
                                            }}
                                            status={
                                                billingErrors.billingEmail ? 'error' : undefined
                                            }
                                            style={{ height: 40, borderRadius: 8 }}
                                        />
                                        {billingErrors.billingEmail && (
                                            <Text style={{ color: '#ff4d4f', fontSize: 12 }}>
                                                {billingErrors.billingEmail}
                                            </Text>
                                        )}
                                    </Flex>
                                </Col>
                            </Row>
                            <Row gutter={[21, 0]}>
                                <Col xs={24} sm={12}>
                                    <Flex vertical gap={4} style={{ marginBottom: 24 }}>
                                        <Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)' }}>
                                            Phone Number
                                        </Text>
                                        <Input
                                            placeholder="Eg. 9876543210"
                                            value={phoneNumber}
                                            onChange={e => {
                                                const val = e.target.value
                                                    .replace(/\D/g, '')
                                                    .slice(0, 10);
                                                setPhoneNumber(val);
                                                if (val.trim())
                                                    setBillingErrors(prev => ({
                                                        ...prev,
                                                        phoneNumber: '',
                                                    }));
                                            }}
                                            onBlur={() => {
                                                if (!phoneNumber.trim())
                                                    setBillingErrors(prev => ({
                                                        ...prev,
                                                        phoneNumber:
                                                            'Please enter the phone number',
                                                    }));
                                                else if (phoneNumber !== phoneNumber.trim())
                                                    setBillingErrors(prev => ({
                                                        ...prev,
                                                        phoneNumber:
                                                            'Phone number cannot start or end with spaces',
                                                    }));
                                                else if (!/^[6-9]\d{9}$/.test(phoneNumber.trim()))
                                                    setBillingErrors(prev => ({
                                                        ...prev,
                                                        phoneNumber:
                                                            'Please enter a valid 10-digit mobile number',
                                                    }));
                                            }}
                                            status={billingErrors.phoneNumber ? 'error' : undefined}
                                            style={{ height: 40, borderRadius: 8 }}
                                        />
                                        {billingErrors.phoneNumber && (
                                            <Text style={{ color: '#ff4d4f', fontSize: 12 }}>
                                                {billingErrors.phoneNumber}
                                            </Text>
                                        )}
                                    </Flex>
                                </Col>
                                {billingAddress && (
                                    <Col xs={24} sm={12}>
                                        <Flex vertical gap={4} style={{ marginBottom: 24 }}>
                                            <Text
                                                style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)' }}
                                            >
                                                Billing Address
                                            </Text>
                                            <Input
                                                value={billingAddress}
                                                readOnly
                                                status={
                                                    billingErrors.billingAddress
                                                        ? 'error'
                                                        : undefined
                                                }
                                                style={{
                                                    height: 40,
                                                    borderRadius: 8,
                                                    background: '#f5f5f5',
                                                    color: '#555',
                                                }}
                                            />
                                            {billingErrors.billingAddress && (
                                                <Text style={{ color: '#ff4d4f', fontSize: 12 }}>
                                                    {billingErrors.billingAddress}
                                                </Text>
                                            )}
                                        </Flex>
                                    </Col>
                                )}
                            </Row>
                        </Card>
                    </Flex>
                </Col>

                {/* Right column — Payment Summary (sticky) */}
                <Col xs={24} md={9} lg={8}>
                    <div style={{ position: 'sticky', top: 20 }}>
                        <Card
                            style={{
                                borderRadius: 22,
                                border: '0.984px solid #E4E7E9',
                                boxShadow: '0px 5px 17.3px -8px rgba(0, 0, 0, 0.08)',
                            }}
                            styles={{ body: { padding: '20px 24px 24px' } }}
                        >
                            <Title
                                level={5}
                                style={{
                                    marginBottom: 0,
                                    fontWeight: 500,
                                    color: '#191C1F',
                                    fontSize: 17,
                                }}
                            >
                                Payment Summary
                            </Title>

                            {/* Base fees */}
                            <Flex vertical gap={10} style={{ marginTop: 20 }}>
                                {hasEmbassyPayment ? (
                                    // Partial payment: only service charges due now
                                    <>
                                        <Flex justify="space-between">
                                            <Text style={{ fontSize: 14, color: '#5F6C72' }}>
                                                Service Fee
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 500,
                                                    color: '#191C1F',
                                                }}
                                            >
                                                ₹
                                                {(
                                                    (visa?.serviceFee ?? 0) * priceScaleFactor
                                                ).toLocaleString('en-IN', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </Text>
                                        </Flex>
                                        <Flex justify="space-between">
                                            <Text style={{ fontSize: 14, color: '#5F6C72' }}>
                                                Platform Fee
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 500,
                                                    color: '#191C1F',
                                                }}
                                            >
                                                ₹
                                                {(
                                                    (visa?.platformFee ?? 0) * priceScaleFactor
                                                ).toLocaleString('en-IN', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </Text>
                                        </Flex>
                                        <Flex justify="space-between">
                                            <Text style={{ fontSize: 14, color: '#5F6C72' }}>
                                                GST (18%)
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 500,
                                                    color: '#191C1F',
                                                }}
                                            >
                                                ₹
                                                {(
                                                    (visa?.gst ?? 0) * priceScaleFactor
                                                ).toLocaleString('en-IN', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </Text>
                                        </Flex>
                                    </>
                                ) : (
                                    // Full payment: all components + service charges, grouped like the Visa Results breakdown
                                    <Flex vertical gap={12}>
                                        <div
                                            style={{
                                                background: '#F8F9FA',
                                                borderRadius: 12,
                                                padding: '14px 16px',
                                            }}
                                        >
                                            <Flex
                                                justify="space-between"
                                                align="center"
                                                style={{ marginBottom: 8 }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        color: '#191C1F',
                                                    }}
                                                >
                                                    Government Fees
                                                </Text>
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        color: '#191C1F',
                                                    }}
                                                >
                                                    ₹
                                                    {(
                                                        (visa?.totalGovtFees ?? 0) *
                                                        priceScaleFactor
                                                    ).toLocaleString('en-IN', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </Text>
                                            </Flex>
                                            <Flex vertical gap={8}>
                                                {(visa?.breakupComponents ?? []).map(c => (
                                                    <Flex
                                                        key={c.component_id}
                                                        justify="space-between"
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 13,
                                                                color: '#5F6C72',
                                                            }}
                                                        >
                                                            {c.component.toLowerCase() ===
                                                            'service fee'
                                                                ? 'Embassy Processing Fee'
                                                                : c.component}
                                                        </Text>
                                                        <Text
                                                            style={{
                                                                fontSize: 13,
                                                                color: '#191C1F',
                                                            }}
                                                        >
                                                            ₹
                                                            {(
                                                                c.original_cost * priceScaleFactor
                                                            ).toLocaleString('en-IN', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </Text>
                                                    </Flex>
                                                ))}
                                            </Flex>
                                        </div>

                                        <div
                                            style={{
                                                background: '#F8F9FA',
                                                borderRadius: 12,
                                                padding: '14px 16px',
                                            }}
                                        >
                                            <Flex
                                                justify="space-between"
                                                align="center"
                                                style={{ marginBottom: 8 }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        color: '#191C1F',
                                                    }}
                                                >
                                                    Service Charges
                                                </Text>
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        color: '#191C1F',
                                                    }}
                                                >
                                                    ₹
                                                    {(
                                                        ((visa?.breakupServiceFee ?? 0) +
                                                            (visa?.breakupTaxServiceFee ?? 0)) *
                                                        priceScaleFactor
                                                    ).toLocaleString('en-IN', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </Text>
                                            </Flex>
                                            <Flex vertical gap={8}>
                                                <Flex justify="space-between">
                                                    <Text
                                                        style={{ fontSize: 13, color: '#5F6C72' }}
                                                    >
                                                        Service Fees
                                                    </Text>
                                                    <Text
                                                        style={{ fontSize: 13, color: '#191C1F' }}
                                                    >
                                                        ₹
                                                        {(
                                                            (visa?.breakupServiceFee ?? 0) *
                                                            priceScaleFactor
                                                        ).toLocaleString('en-IN', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </Text>
                                                </Flex>
                                                <Flex justify="space-between">
                                                    <Text
                                                        style={{ fontSize: 13, color: '#5F6C72' }}
                                                    >
                                                        GST @ 18%
                                                    </Text>
                                                    <Text
                                                        style={{ fontSize: 13, color: '#191C1F' }}
                                                    >
                                                        ₹
                                                        {(
                                                            (visa?.breakupTaxServiceFee ?? 0) *
                                                            priceScaleFactor
                                                        ).toLocaleString('en-IN', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </Text>
                                                </Flex>
                                            </Flex>
                                        </div>
                                    </Flex>
                                )}
                            </Flex>

                            {/* Selected add-ons */}
                            {ADD_ON_SERVICES.filter(a => selectedAddOns.has(a.key)).length > 0 && (
                                <>
                                    <Divider style={{ margin: '12px 0' }} />
                                    <Flex vertical gap={10}>
                                        {ADD_ON_SERVICES.filter(a => selectedAddOns.has(a.key)).map(
                                            a => (
                                                <Flex key={a.key} justify="space-between">
                                                    <Text
                                                        style={{ fontSize: 15, color: '#191C1F' }}
                                                    >
                                                        {a.label}
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontSize: 15,
                                                            fontWeight: 600,
                                                            color: '#191C1F',
                                                        }}
                                                    >
                                                        ₹
                                                        {(a.flat
                                                            ? a.price
                                                            : a.price * totalTravellers
                                                        ).toLocaleString('en-IN', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </Text>
                                                </Flex>
                                            )
                                        )}
                                    </Flex>
                                </>
                            )}

                            <Divider style={{ margin: '12px 0' }} />

                            {/* Pay Now total */}
                            <Flex justify="space-between" className="mb-4">
                                <Text style={{ fontSize: 15, color: '#191C1F' }}>Pay Now</Text>
                                <Text style={{ fontSize: 15, fontWeight: 600, color: '#191C1F' }}>
                                    ₹
                                    {payNow.toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </Text>
                            </Flex>

                            {/* Continue button */}
                            <Button
                                type="primary"
                                block
                                style={{
                                    backgroundColor: '#FF4F4F',
                                    borderColor: '#FF4F4F',
                                    borderRadius: 6,
                                    height: 46,
                                    fontWeight: 600,
                                    fontSize: 14,
                                }}
                                loading={isPaying}
                                onClick={async () => {
                                    const newErrors: Record<string, string> = {};
                                    if (!companyName.trim())
                                        newErrors.companyName = 'Please enter the company name';
                                    else if (companyName !== companyName.trim())
                                        newErrors.companyName =
                                            'Company name cannot start or end with spaces';
                                    else if (companyName.trim().length < 3)
                                        newErrors.companyName =
                                            'Company name must be at least 3 characters';
                                    else if (companyName.trim().length > 100)
                                        newErrors.companyName =
                                            'Company name must not exceed 100 characters';
                                    else if (!/[a-zA-Z]/.test(companyName))
                                        newErrors.companyName =
                                            'Company name cannot contain numbers only';
                                    else if (!/^[a-zA-Z0-9 \-&]+$/.test(companyName.trim()))
                                        newErrors.companyName =
                                            'Please enter a valid company name using letters, numbers, spaces, - and &';
                                    if (!billingEmail.trim())
                                        newErrors.billingEmail = 'Please enter the billing email';
                                    else if (billingEmail !== billingEmail.trim())
                                        newErrors.billingEmail =
                                            'Billing email cannot start or end with spaces';
                                    else if (
                                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail.trim())
                                    )
                                        newErrors.billingEmail = 'Please enter a valid email';
                                    if (!phoneNumber.trim())
                                        newErrors.phoneNumber = 'Please enter the phone number';
                                    else if (phoneNumber !== phoneNumber.trim())
                                        newErrors.phoneNumber =
                                            'Phone number cannot start or end with spaces';
                                    else if (!/^[6-9]\d{9}$/.test(phoneNumber.trim()))
                                        newErrors.phoneNumber =
                                            'Please enter a valid 10-digit mobile number';
                                    if (billingAddress && !/[a-zA-Z]/.test(billingAddress))
                                        newErrors.billingAddress =
                                            'Billing address cannot contain numbers only';
                                    setBillingErrors(newErrors);
                                    if (Object.keys(newErrors).length > 0) return;
                                    if (!visa || !state?.passengers?.length) return;
                                    const selectedAddonList = ADD_ON_SERVICES.filter(a =>
                                        selectedAddOns.has(a.key)
                                    );
                                    setIsPaying(true);
                                    try {
                                        await initiatePayment({
                                            visa,
                                            // Send the current passenger counts, not the stale ones from when the
                                            // visa was first selected — passengers may have been added/removed since.
                                            travellers: {
                                                adults: actualAdults,
                                                children: actualChildren,
                                                infants: actualInfants,
                                            },
                                            selectedAddOns: selectedAddonList,
                                            totalPayNow: payNow,
                                            visaAmount:
                                                state.visaBaseAmount ??
                                                (hasEmbassyPayment
                                                    ? (visa.totalPayNow ?? 0)
                                                    : (visa.price ?? 0)),
                                            companyName,
                                            billingEmail,
                                            phoneNumber,
                                            billingAddress,
                                            destinationName: state?.destination,
                                            category: state?.visaType,
                                            productId: visa.productId,
                                            travelDate:
                                                state.travelDate ??
                                                new Date().toISOString().split('T')[0],
                                            applicants: state.passengers.map(p => ({
                                                firstName: p.firstName,
                                                lastName: p.lastName,
                                                dob: p.dob,
                                                passportNo: p.passportNo,
                                                contactNumber: p.contactNumber,
                                                documents: p.stagedDocuments,
                                            })),
                                            billingAddressLine1: state.billingAddressLine1,
                                            billingAddressLine2: state.billingAddressLine2,
                                            billingCity: state.billingCity,
                                            billingState: state.billingState,
                                            billingPincode: state.billingPincode,
                                            productBreakup: state.productBreakup,
                                        });
                                    } finally {
                                        setIsPaying(false);
                                    }
                                }}
                            >
                                Continue
                            </Button>

                            {/* Embassy fee notice — only shown for partial payment */}
                            {hasEmbassyPayment && visa?.totalGovtFees ? (
                                <Flex
                                    gap={8}
                                    className="mt-4 p-3 rounded-lg"
                                    style={{ backgroundColor: '#FFFBEB' }}
                                >
                                    <span style={{ color: '#D97706', fontSize: 14, marginTop: 1 }}>
                                        ●
                                    </span>
                                    <Text style={{ fontSize: 12, color: '#92400E' }}>
                                        Embassy fee of ₹
                                        {(visa.totalGovtFees * priceScaleFactor).toLocaleString(
                                            'en-IN',
                                            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                                        )}{' '}
                                        will be collected separately at the Embassy after document
                                        approval.
                                    </Text>
                                </Flex>
                            ) : null}
                        </Card>

                        {/* <Button
                            block
                            className="mt-3"
                            size="large"
                            onClick={() => navigate(-1)}
                            style={{ borderColor: '#FF4F4F', color: '#FF4F4F', borderRadius: 8 }}
                        >
                            Go back
                        </Button> */}
                    </div>
                </Col>
            </Row>
        </Flex>
    );
};

export default VisaPayment;
