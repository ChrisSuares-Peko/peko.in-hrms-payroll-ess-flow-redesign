import { useState } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import {
    Button,
    Checkbox,
    Col,
    Flex,
    InputNumber,
    Popover,
    Row,
    Select,
    Skeleton,
    Table,
    Tabs,
    Typography,
} from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import ConfirmationModal from '@src/components/molecular/modals/ConfirmationModal';
import { paths } from '@src/routes/paths';

import CloudBasedSolutionPng from '../assets/img/cloud_based_solution.png';
import CloudComputingPng from '../assets/img/cloud_computing.png';
import CloudSecurityPng from '../assets/img/cloud_security.png';
import CloudSolutionPng from '../assets/img/cloud_solution.png';
import MeetingPng from '../assets/img/meeting.png';
import AcronisIcon from '../assets/svg/acronis.svg';
import AlmaLinuxIcon from '../assets/svg/almalinux.svg';
import CpanelIcon from '../assets/svg/cpanel.svg';
import IndiaFlagIcon from '../assets/svg/india.svg';
import KvmIcon from '../assets/svg/kvm.svg';
import OpenStackIcon from '../assets/svg/openstack.svg';
import PleskIcon from '../assets/svg/plesk.svg';
import RockyLinuxIcon from '../assets/svg/rockylinux.svg';
import UbuntuIcon from '../assets/svg/ubuntu.svg';
import UsaFlagIcon from '../assets/svg/usa.svg';
import WhmcsIcon from '../assets/svg/whmcs.svg';
import useHostingPlans, { HostingPlan } from '../hooks/useHostingPlans';
import useServiceCart from '../hooks/useServiceCart';
import { CONTROL_PANEL_OPTIONS } from '../utils/vpsUtils';

const { Title, Text, Paragraph } = Typography;

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVER_LOCATION_MAP: Record<string, string> = {
    india: 'in',
    us: 'us',
};

const ACRONIS_PRICE_PER_GB = 51;
const WHMCS_PRICE = 127.04;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatMb = (mb: number): string => {
    if (mb >= 1048576) return `${(mb / 1048576).toFixed(0)} TB`;
    if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`;
    return `${mb} MB`;
};

const tenureLabel = (months: number): string => {
    if (months < 12) return `${months} Month${months > 1 ? 's' : ''}`;
    if (months === 12) return '1 Year';
    return `${months / 12} Years`;
};

const getTenureOptions = (plan: HostingPlan) => {
    const add = plan.pricingDetails?.add ?? {};
    return Object.keys(add)
        .map(Number)
        .sort((a, b) => a - b)
        .map(months => ({ value: months, label: tenureLabel(months) }));
};

const getDefaultTenure = (plan: HostingPlan): number => {
    const keys = Object.keys(plan.pricingDetails?.add ?? {})
        .map(Number)
        .sort((a, b) => a - b);
    return keys[0] ?? 12;
};

const getPriceForTenure = (plan: HostingPlan, tenure: number): number | null =>
    plan.pricingDetails?.add?.[String(tenure)] ?? plan.price ?? null;

// ─── Shared icon circle style ─────────────────────────────────────────────────

const iconCircleClass = 'flex h-12 w-12 shrink-0 items-center justify-center rounded-full';

const tabIllustration = (src: string, alt: string) => (
    <div className="shrink-0" style={{ width: 300 }}>
        <img src={src} alt={alt} className="w-full h-auto block" />
    </div>
);

// ─── Feature Tabs ─────────────────────────────────────────────────────────────

const tabItems = [
    {
        key: 'deploy',
        label: 'Deploy',
        children: (
            <Flex gap={32} align="flex-start" style={{ paddingTop: 16, paddingBottom: 16 }}>
                {/* Left: content */}
                <div className="flex-1 min-w-0">
                    <div className="mb-5">
                        <Title level={5} style={{ marginBottom: 4 }}>
                            Instant Provisioning
                        </Title>
                        <p className="text-gray-600 m-0" style={{ fontSize: 13 }}>
                            Set up and running instantly! Our servers are provisioned within a few
                            minutes.
                        </p>
                    </div>
                    <div className="mb-5">
                        <Title level={5} style={{ marginBottom: 6 }}>
                            Choose your Operating System
                        </Title>
                        <p className="text-gray-600 mb-3" style={{ fontSize: 13 }}>
                            Get complete flexibility to choose the operating system that works for
                            you. Here are operating systems available with our service.
                        </p>
                        <Flex gap={24} wrap="wrap">
                            {[
                                { label: 'Ubuntu', src: UbuntuIcon },
                                { label: 'AlmaLinux', src: AlmaLinuxIcon },
                                { label: 'Rocky Linux', src: RockyLinuxIcon },
                                { label: 'cPanel/WHM', src: CpanelIcon },
                            ].map(({ label, src }) => (
                                <Flex key={label} vertical align="center" gap={6}>
                                    <div className={`bg-gray-50 ${iconCircleClass}`}>
                                        <img
                                            src={src}
                                            alt={label}
                                            className="h-7 w-7 object-contain"
                                        />
                                    </div>
                                    <span className="text-gray-500" style={{ fontSize: 11 }}>{label}</span>
                                </Flex>
                            ))}
                        </Flex>
                    </div>
                    <div>
                        <Title level={5} style={{ marginBottom: 6 }}>
                            Choose your management panel
                        </Title>
                        <p className="text-gray-600 mb-3" style={{ fontSize: 13 }}>
                            Optionally, you can choose easy-to-use tools for easy Server Management.
                            Here are the available add-ons.
                        </p>
                        <Flex gap={24} wrap="wrap">
                            {[
                                { label: 'cPanel/WHM', src: CpanelIcon },
                                { label: 'Plesk', src: PleskIcon },
                                { label: 'WHMCS', src: WhmcsIcon },
                            ].map(({ label, src }) => (
                                <Flex key={label} vertical align="center" gap={6}>
                                    <div className={`bg-gray-50 ${iconCircleClass}`}>
                                        <img
                                            src={src}
                                            alt={label}
                                            className="h-7 w-7 object-contain"
                                        />
                                    </div>
                                    <span className="text-gray-500" style={{ fontSize: 11 }}>{label}</span>
                                </Flex>
                            ))}
                        </Flex>
                    </div>
                </div>

                {/* Right: illustration */}
                {tabIllustration(CloudBasedSolutionPng, 'Cloud Based Solution')}
            </Flex>
        ),
    },
    {
        key: 'additionalStorage',
        label: 'Additional Storage',
        children: (
            <Flex gap={32} align="flex-start" style={{ paddingTop: 16, paddingBottom: 16 }}>
                <div className="flex-1 min-w-0">
                    <div className="mb-4">
                        <Title level={5} style={{ marginBottom: 6 }}>
                            High-performance NVMe SSD Storage Volumes At{' '}
                            <span className="text-lightRed">
                                ₹{ACRONIS_PRICE_PER_GB}/GB/month
                            </span>
                        </Title>
                        <p className="text-gray-600 m-0" style={{ fontSize: 13 }}>
                            Get up and running instantly! Our servers are provisioned within a few
                            minutes.
                        </p>
                    </div>
                    <div className="mb-4">
                        <Title level={5} style={{ marginBottom: 8 }}>
                            Flexible Volumes
                        </Title>
                        <Flex vertical gap={6}>
                            {[
                                'Get lightning-fast NVMe volumes starting from 1 GB to 5000 GB',
                                'Seamlessly attach multiple high-speed volumes for expanded data capacity',
                                'Scale your NVMe storage independently as your requirements grow',
                                'Advanced integration with Acronis Backup for complete data protection',
                            ].map(item => (
                                <Flex key={item} align="flex-start" gap={8}>
                                    <span
                                        className="text-lightRed leading-5 shrink-0"
                                        style={{ fontSize: 16 }}
                                    >
                                        •
                                    </span>
                                    <span className="text-gray-600" style={{ fontSize: 13 }}>{item}</span>
                                </Flex>
                            ))}
                        </Flex>
                    </div>
                    <div>
                        <Title level={5} style={{ marginBottom: 4 }}>
                            Simplified Billing
                        </Title>
                        <p className="text-gray-600 m-0" style={{ fontSize: 13 }}>
                            Available at a flat fee. No hidden costs for Bandwidth or IOPS
                            performance.
                        </p>
                    </div>
                </div>

                {tabIllustration(CloudComputingPng, 'Cloud Computing')}
            </Flex>
        ),
    },
    {
        key: 'manage',
        label: 'Manage',
        children: (
            <Flex gap={32} align="flex-start" style={{ paddingTop: 16, paddingBottom: 16 }}>
                <div className="flex-1 min-w-0">
                    {[
                        {
                            title: 'Server Management',
                            desc: 'You can Start, Stop, Restart, Reissue your VPS from the Server Management Panel.',
                        },
                        {
                            title: 'Full Root Access',
                            desc: 'With full root you are given complete control to manage your server resources.',
                        },
                        {
                            title: 'VPS Access',
                            desc: 'We allow you quick access to your VPS for easy management.',
                        },
                        {
                            title: 'WHMCS',
                            desc: 'Optionally you can install & migrate to WHMCS with your VPS Server-side results.',
                        },
                    ].map(({ title, desc }) => (
                        <div key={title} className="mb-4">
                            <Title level={5} style={{ marginBottom: 4 }}>
                                {title}
                            </Title>
                            <p className="text-gray-600 m-0" style={{ fontSize: 13 }}>{desc}</p>
                        </div>
                    ))}
                </div>

                {tabIllustration(CloudSolutionPng, 'Cloud Solution')}
            </Flex>
        ),
    },
    {
        key: 'secure',
        label: 'Secure',
        children: (
            <Flex gap={32} align="flex-start" style={{ paddingTop: 16, paddingBottom: 16 }}>
                <div className="flex-1 min-w-0">
                    <div className="mb-4">
                        <Title level={5} style={{ marginBottom: 4 }}>
                            DDoS Protection
                        </Title>
                        <p className="text-gray-600 m-0" style={{ fontSize: 13 }}>
                            Our state-of-the-art infrastructure ensures your VPS is protected
                            against any attacks.
                        </p>
                    </div>
                    <div className="mb-4">
                        <Title level={5} style={{ marginBottom: 4 }}>
                            State-of-the-Art Infrastructure
                        </Title>
                        <p className="text-gray-600 mb-3" style={{ fontSize: 13 }}>
                            All our servers are powered by world infrastructure to keep them online
                            and running.
                        </p>
                        <Flex gap={16} align="center" wrap="wrap">
                            {[
                                { label: 'OpenStack', src: OpenStackIcon },
                                { label: 'KVM', src: KvmIcon },
                                { label: 'Acronis', src: AcronisIcon },
                            ].map(({ label, src }) => (
                                <div
                                    key={label}
                                    className="border border-gray-200 rounded-md py-1.5 px-3.5 flex items-center gap-2"
                                >
                                    <img
                                        src={src}
                                        alt={label}
                                        className="h-5 w-5 object-contain"
                                    />
                                    <span
                                        className="text-gray-700 font-medium"
                                        style={{ fontSize: 13 }}
                                    >
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </Flex>
                    </div>
                    <div>
                        <Title level={5} style={{ marginBottom: 4 }}>
                            Private Networking
                        </Title>
                        <p className="text-gray-600 m-0" style={{ fontSize: 13 }}>
                            Setup and use network instantly in a few clicks.
                        </p>
                    </div>
                </div>

                {tabIllustration(CloudSecurityPng, 'Cloud Security')}
            </Flex>
        ),
    },
    {
        key: 'support',
        label: '24/7 Support',
        children: (
            <Flex gap={32} align="flex-start" style={{ paddingTop: 16, paddingBottom: 16 }}>
                <div className="flex-1 min-w-0">
                    <Title level={5} style={{ marginBottom: 6 }}>
                        We are available 24/7 to help you with your queries
                    </Title>
                    <p className="text-gray-600 mb-3" style={{ fontSize: 13 }}>
                        Our servers include semi-managed support related to:
                    </p>
                    <Flex vertical gap={6}>
                        {[
                            'Boot, Login, Investigating Network/Hardware related issues',
                            'Initial module installation and basic firewall setup',
                            'Setup and re-installation of KVM VPS',
                            'Core OS Upgrades & Patches',
                            'Reverse DNS Setup',
                        ].map(item => (
                            <Flex key={item} align="flex-start" gap={8}>
                                <span
                                    className="text-lightRed leading-5 shrink-0"
                                    style={{ fontSize: 16 }}
                                >
                                    •
                                </span>
                                <span className="text-gray-600" style={{ fontSize: 13 }}>{item}</span>
                            </Flex>
                        ))}
                    </Flex>
                </div>

                {tabIllustration(MeetingPng, 'Support Team')}
            </Flex>
        ),
    },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const HostingPage = () => {
    const navigate = useNavigate();
    const [serverLocation, setServerLocation] = useState<'india' | 'us'>('india');
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedPlan, setSelectedPlan] = useState<HostingPlan | null>(null);
    const [tenureMap, setTenureMap] = useState<Record<string, number>>({});
    const [os, setOs] = useState('alma_8');
    const [controlPanel, setControlPanel] = useState('none');
    const [acronisGb, setAcronisGb] = useState<number>(10);
    const [acronisEnabled, setAcronisEnabled] = useState(false);
    const [whmcsEnabled, setWhmcsEnabled] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const { plans, isLoading } = useHostingPlans('vps_server');
    const { handleAddToCart, cartConflictModalProps } = useServiceCart();

    const onSelectPlan = (plan: HostingPlan) => {
        const defaultOs = plan.vendorDetails?.supported_os?.find(o => o.is_default && !o.is_discontinued);
        setOs(defaultOs?.os_name ?? plan.vendorDetails?.supported_os?.[0]?.os_name ?? 'alma_8');
        setSelectedPlan(plan);
        setStep(2);
    };

    const onBack = () => {
        setStep(1);
        setAcronisEnabled(false);
        setWhmcsEnabled(false);
    };

    const filteredPlans = plans.filter(p =>
        serverLocation === 'us' ? p.productId.endsWith('us') : !p.productId.endsWith('us')
    );

    const osOptions =
        selectedPlan?.vendorDetails?.supported_os
            ?.filter(o => !o.is_discontinued)
            ?.map(o => ({ label: o.os_display_name, value: o.os_name })) ?? [];

    const getControlPanelPrice = () =>
        controlPanel !== 'none' ? (selectedPlan?.addons?.[controlPanel] ?? 0) : 0;

    const computedTotal = () => {
        const tenure = selectedPlan
            ? (tenureMap[selectedPlan.planId] ?? getDefaultTenure(selectedPlan))
            : 0;
        const base = selectedPlan ? (getPriceForTenure(selectedPlan, tenure) ?? 0) : 0;
        const acronis = acronisEnabled ? ACRONIS_PRICE_PER_GB * acronisGb : 0;
        const whmcs = whmcsEnabled ? WHMCS_PRICE : 0;
        const cpPrice = getControlPanelPrice();
        return (base + acronis + whmcs + cpPrice).toFixed(2);
    };

    const priceBreakdown = () => {
        const tenure = selectedPlan
            ? (tenureMap[selectedPlan.planId] ?? getDefaultTenure(selectedPlan))
            : 0;
        const base = selectedPlan ? (getPriceForTenure(selectedPlan, tenure) ?? 0) : 0;
        const cpPrice = getControlPanelPrice();
        const cpLabel = CONTROL_PANEL_OPTIONS.find(o => o.value === controlPanel)?.label;
        const items: { label: string; price: number }[] = [
            { label: `${selectedPlan?.planName ?? 'Plan'} (${tenureLabel(tenure)})`, price: base },
        ];
        if (cpPrice > 0 && cpLabel) items.push({ label: `${cpLabel} (Control Panel)`, price: cpPrice });
        if (whmcsEnabled) items.push({ label: 'WHMCS', price: WHMCS_PRICE });
        if (acronisEnabled) items.push({ label: `Acronis Backup (${acronisGb} GB)`, price: ACRONIS_PRICE_PER_GB * acronisGb });
        return items;
    };

    const onProceedToCart = async () => {
        if (!selectedPlan) return;
        setIsAdding(true);
        const billingCycle = tenureMap[selectedPlan.planId] ?? getDefaultTenure(selectedPlan);

        const addons: string[] = [];
        const addonQuantities: Record<string, number> = {};
        if (whmcsEnabled) {
            addons.push('whmcs');
            addonQuantities.whmcs = 1;
        }
        if (controlPanel !== 'none') {
            addons.push(controlPanel);
        }

        const result = await handleAddToCart({
            itemType: 'vps_server',
            productId: selectedPlan.productId,
            planId: selectedPlan.planId,
            productName: selectedPlan.planName,
            billingCycle,
            serverLocation: SERVER_LOCATION_MAP[serverLocation],
            os,
            addons,
            addonQuantities,
        });
        setIsAdding(false);
        if (result) navigate(`${paths.dashboard.domainHosting}/${paths.domainHosting.cart}`);
    };

    const columns = [
        {
            title: 'Plan Name',
            dataIndex: 'planName',
            key: 'planName',
            render: (name: string) => <Text strong>{name}</Text>,
        },
        {
            title: 'RAM',
            key: 'ram',
            render: (_: any, r: HostingPlan) =>
                r.vendorDetails?.ram != null ? formatMb(r.vendorDetails.ram) : '—',
        },
        {
            title: 'CPU',
            key: 'cpu',
            render: (_: any, r: HostingPlan) =>
                r.vendorDetails?.cpu != null ? `${r.vendorDetails.cpu} vCPU` : '—',
        },
        {
            title: 'Disk Space',
            key: 'diskSpace',
            render: (_: any, r: HostingPlan) =>
                r.vendorDetails?.space != null ? formatMb(r.vendorDetails.space) : '—',
        },
        {
            title: 'Disk Type',
            key: 'diskType',
            render: (_: any, r: HostingPlan) => r.vendorDetails?.diskType ?? '—',
        },
        {
            title: 'Bandwidth',
            key: 'bandwidth',
            render: (_: any, r: HostingPlan) =>
                r.vendorDetails?.bandwidth != null
                    ? formatMb(Number(r.vendorDetails.bandwidth))
                    : '—',
        },
        {
            title: 'Tenure',
            key: 'tenure',
            render: (_: any, r: HostingPlan) => (
                <Select
                    options={getTenureOptions(r)}
                    value={tenureMap[r.planId] ?? getDefaultTenure(r)}
                    onChange={val => setTenureMap(prev => ({ ...prev, [r.planId]: val }))}
                    style={{ width: 110 }}
                    size="small"
                />
            ),
        },
        {
            title: 'Price',
            key: 'price',
            render: (_: any, r: HostingPlan) => {
                const tenure = tenureMap[r.planId] ?? getDefaultTenure(r);
                const price = getPriceForTenure(r, tenure);
                return price != null ? (
                    <span>
                        <Text strong style={{ fontSize: 15 }}>
                            ₹{price}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>/MO</Text>
                    </span>
                ) : (
                    '—'
                );
            },
        },
        {
            title: '',
            key: 'action',
            render: (_: any, r: HostingPlan) => (
                <Button
                    className="bg-lightRed border-lightRed text-white"
                    onClick={() => onSelectPlan(r)}
                >
                    Select Plan
                </Button>
            ),
        },
    ];

    const minPrice =
        filteredPlans.length > 0
            ? Math.min(
                  ...filteredPlans
                      .map(p => getPriceForTenure(p, getDefaultTenure(p)) ?? Infinity)
                      .filter(v => v !== Infinity)
              )
            : null;

    return (
        <Content className="bg-white" style={{ minHeight: '100vh' }}>
            {/* HERO */}
            <div
                className="py-10 px-8"
                style={{
                    background: 'linear-gradient(to bottom, #fff 0%, #FFF5F5 100%)',
                }}
            >
                <div style={{ maxWidth: 760 }}>
                    <Title level={3} style={{ marginBottom: 16, lineHeight: 1.4, fontWeight: 700 }}>
                        High-Performance Servers For Faster Websites &amp; Applications With Linux
                        KVM VPS Server
                    </Title>
                    <Flex vertical gap={6} style={{ marginBottom: 20 }}>
                        {[
                            'High performance NVMe SSD Storage Volumes',
                            'Instant Provisioning',
                            'Full Root Access',
                        ].map(item => (
                            <Flex key={item} align="center" gap={8}>
                                <span className="text-lightRed leading-none" style={{ fontSize: 16 }}>
                                    •
                                </span>
                                <span className="text-gray-600" style={{ fontSize: 14 }}>{item}</span>
                            </Flex>
                        ))}
                    </Flex>
                    {minPrice != null && (
                        <Paragraph className="!m-0 text-sm !text-gray-700">
                            As low as{' '}
                            <Text strong className="!text-lightRed">
                                ₹{minPrice}
                            </Text>
                            <Text className="text-xs !text-gray-500">/MO</Text>
                        </Paragraph>
                    )}
                </div>
            </div>

            {/* FEATURE TABS */}
            <div className="border-b border-b-gray-100 pt-6 px-6 pb-0">
                <Title level={4} style={{ marginBottom: 0 }}>
                    Features
                </Title>
                <Tabs items={tabItems} />
            </div>

            {/* SETUP WIZARD */}
            <div className="py-10 px-6">
                <div className="text-center mb-4">
                    <Title level={4} style={{ margin: 0 }}>
                        Set Up Your VPS In 2 Easy Steps
                    </Title>
                </div>

                {/* Step indicator + server location */}
                <Flex
                    justify="space-between"
                    align="center"
                    style={{ marginBottom: 20 }}
                    wrap="wrap"
                    gap={16}
                >
                    {/* Numbered step indicator */}
                    <Flex align="center" gap={0} style={{ flex: 1, justifyContent: 'center' }}>
                        {/* Step 1 */}
                        <Flex
                            align="center"
                            gap={10}
                            onClick={() => step === 2 && onBack()}
                            style={{ cursor: step === 2 ? 'pointer' : 'default' }}
                        >
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${step === 1 ? 'bg-lightRed text-white' : 'bg-gray-200 text-gray-500'}`}
                            >
                                1
                            </div>
                            <span
                                className={`whitespace-nowrap ${step === 1 ? 'text-gray-900 font-semibold' : 'text-gray-400 font-normal'}`}
                                style={{ fontSize: 14 }}
                            >
                                Select a Plan
                            </span>
                        </Flex>

                        {/* Arrow connector */}
                        <div className="bg-gray-200 w-12 h-0.5 mx-3 shrink-0" />

                        {/* Step 2 */}
                        <Flex align="center" gap={10}>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${step === 2 ? 'bg-lightRed text-white' : 'bg-gray-200 text-gray-500'}`}
                            >
                                2
                            </div>
                            <span
                                className={`whitespace-nowrap ${step === 2 ? 'text-gray-900 font-semibold' : 'text-gray-400 font-normal'}`}
                                style={{ fontSize: 14 }}
                            >
                                Choose Add-ons
                            </span>
                        </Flex>
                    </Flex>

                    {/* Server location flags */}
                    <Flex align="center" gap={8}>
                        {(
                            [
                                { key: 'us', label: 'USA', icon: UsaFlagIcon },
                                { key: 'india', label: 'India', icon: IndiaFlagIcon },
                            ] as const
                        ).map(({ key, label, icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setServerLocation(key)}
                                className={`flex items-center gap-1.5 cursor-pointer py-1 pr-3 pl-2 ${serverLocation === key ? 'border-lightRed' : 'border-gray-200'}`}
                                style={{
                                    borderWidth: '1.5px',
                                    borderStyle: 'solid',
                                    borderRadius: 20,
                                    background: serverLocation === key ? '#FFF5F5' : '#fff',
                                }}
                            >
                                <img
                                    src={icon}
                                    alt={label}
                                    className="h-4 object-cover rounded-sm"
                                    style={{ width: 22 }}
                                />
                                <span
                                    className={`font-medium ${serverLocation === key ? 'text-lightRed' : 'text-gray-700'}`}
                                    style={{ fontSize: 13 }}
                                >
                                    {label}
                                </span>
                            </button>
                        ))}
                    </Flex>
                </Flex>

                {/* STEP 1: Plan Table */}
                {step === 1 &&
                    (isLoading ? (
                        <Skeleton active />
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={filteredPlans}
                            rowKey="planId"
                            pagination={false}
                            size="middle"
                            scroll={{ x: 'max-content' }}
                            style={{ borderRadius: 8, border: '1px solid #F3F4F6' }}
                        />
                    ))}

                {/* STEP 2: Configuration */}
                {step === 2 && selectedPlan && (
                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={16}>
                            {/* Selected plan summary */}
                            <div className="border border-gray-200 rounded-lg p-4 mb-6">
                                <Title level={5} style={{ marginBottom: 4 }}>
                                    {selectedPlan.planName}
                                </Title>
                                {selectedPlan.description && (
                                    <p className="text-gray-500 m-0" style={{ fontSize: 13 }}>
                                        {selectedPlan.description}
                                    </p>
                                )}
                            </div>

                            {/* Operating System */}
                            <div className="mb-6">
                                <p
                                    className="text-gray-900 mb-2 font-semibold"
                                    style={{ fontSize: 14 }}
                                >
                                    Operating System
                                </p>
                                <Select
                                    options={osOptions}
                                    value={os}
                                    onChange={setOs}
                                    style={{ width: 260 }}
                                />
                                <p className="text-gray-400 mt-1.5" style={{ fontSize: 12 }}>
                                    Choose the operating system for your VPS. You are not limited to
                                    alter it on your server.
                                </p>
                            </div>

                            {/* Control Panel */}
                            <div className="mb-6">
                                <p
                                    className="text-gray-900 mb-2 font-semibold"
                                    style={{ fontSize: 14 }}
                                >
                                    Control Panel
                                </p>
                                <Select
                                    options={CONTROL_PANEL_OPTIONS}
                                    value={controlPanel}
                                    onChange={setControlPanel}
                                    style={{ width: 260 }}
                                />
                            </div>

                            {/* Acronis Cyber Backup */}
                            <div className="border border-gray-200 rounded-lg p-4 mb-6">
                                <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
                                    <img
                                        src={AcronisIcon}
                                        alt="Acronis"
                                        className="object-contain"
                                        style={{ width: 22, height: 22 }}
                                    />
                                    <p
                                        className="text-gray-900 m-0 font-semibold"
                                        style={{ fontSize: 14 }}
                                    >
                                        Acronis Cyber Backup (₹{ACRONIS_PRICE_PER_GB}.00/mo)
                                    </p>
                                </Flex>
                                <p className="text-gray-500 mb-3" style={{ fontSize: 13 }}>
                                    Securely backup your server data on the cloud with Acronis Cyber
                                    Backup. One click setup and simple management.{' '}
                                    <span className="text-lightRed cursor-pointer">
                                        Learn More
                                    </span>
                                </p>
                                <Flex align="center" gap={8}>
                                    <InputNumber
                                        min={10}
                                        max={500}
                                        value={acronisGb}
                                        onChange={val => {
                                            if (val) setAcronisGb(val);
                                        }}
                                        style={{ width: 80 }}
                                        disabled={!acronisEnabled}
                                    />
                                    <Button
                                        style={
                                            acronisEnabled
                                                ? { borderColor: '#F87171', color: '#F87171' }
                                                : { borderColor: '#D1D5DB', color: '#374151' }
                                        }
                                        onClick={() => setAcronisEnabled(prev => !prev)}
                                    >
                                        {acronisEnabled ? 'Remove' : 'Add'}
                                    </Button>
                                </Flex>
                                <p className="text-gray-400 mt-2" style={{ fontSize: 12 }}>
                                    We recommend purchasing Acronis backup since it is ahead of your
                                    entire disk space.
                                </p>
                            </div>

                            {/* Add-ons */}
                            <div>
                                <p
                                    className="text-gray-900 mb-3 font-semibold"
                                    style={{ fontSize: 14 }}
                                >
                                    Add-ons
                                </p>
                                <Checkbox
                                    checked={whmcsEnabled}
                                    onChange={e => setWhmcsEnabled(e.target.checked)}
                                >
                                    WHMCS (₹{WHMCS_PRICE.toFixed(2)}/mo)
                                </Checkbox>
                                <p className="text-gray-400 mt-2" style={{ fontSize: 12 }}>
                                    You can also choose more add-ons to get the most out of your
                                    VPS.
                                </p>
                            </div>
                        </Col>

                        {/* Right: Total + CTA */}
                        <Col xs={24} lg={8}>
                            <div className="border border-gray-200 rounded-lg p-5 sticky top-4">
                                <Flex
                                    justify="space-between"
                                    align="center"
                                    style={{ marginBottom: 4 }}
                                >
                                    <Flex align="center" gap={6}>
                                        <span className="text-gray-700" style={{ fontSize: 14 }}>Total :</span>
                                        <Popover
                                            title="Price Breakdown"
                                            trigger="hover"
                                            content={
                                                <div style={{ minWidth: 220 }}>
                                                    {priceBreakdown().map(item => (
                                                        <Flex key={item.label} justify="space-between" gap={16} style={{ marginBottom: 6 }}>
                                                            <span className="text-gray-700" style={{ fontSize: 13 }}>{item.label}</span>
                                                            <span className="text-gray-900 font-semibold" style={{ fontSize: 13 }}>₹ {item.price.toFixed(2)}</span>
                                                        </Flex>
                                                    ))}
                                                </div>
                                            }
                                        >
                                            <InfoCircleOutlined style={{ color: '#9CA3AF', cursor: 'pointer', fontSize: 14 }} />
                                        </Popover>
                                    </Flex>
                                    <span
                                        className="text-gray-900 font-semibold"
                                        style={{ fontSize: 14 }}
                                    >
                                        ₹ {computedTotal()}
                                    </span>
                                </Flex>
                                <p className="text-gray-400 mb-5" style={{ fontSize: 12 }}>
                                    (No tax included)
                                </p>
                                <Flex gap={12}>
                                    <Button block onClick={onBack}>
                                        Back
                                    </Button>
                                    <Button
                                        block
                                        className="bg-lightRed border-lightRed text-white"
                                        loading={isAdding}
                                        onClick={onProceedToCart}
                                    >
                                        Proceed to Cart
                                    </Button>
                                </Flex>
                            </div>
                        </Col>
                    </Row>
                )}
            </div>
            <ConfirmationModal {...cartConflictModalProps} />
        </Content>
    );
};

export default HostingPage;
