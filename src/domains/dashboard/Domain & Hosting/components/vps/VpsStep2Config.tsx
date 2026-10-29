import React, { useMemo } from 'react';

import {
    Button,
    Checkbox,
    Col,
    ConfigProvider,
    Flex,
    Row,
    Select,
    Typography,
} from 'antd';

import { type HostingPlan } from '../../hooks/useHostingPlans';

const { Title, Text } = Typography;

const formatControlPanelLabel = (name: string): string =>
    name
        .split('_')
        .map(word => {
            if (word === 'cpanel') return 'cPanel';
            if (word === 'dvps') return 'DVPS';
            if (word === 'whm') return 'WHM';
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');

interface Props {
    selectedPlan: HostingPlan;
    step2Title: string;
    step2Specs: string;
    step2Tenure: number;
    os: string;
    controlPanel: string;
    acronisEnabled: boolean;
    acronisGb: number;
    acronisPricePerGb: number | null;
    backupPlanLoading: boolean;
    minStorageSize: number;
    maxStorageSize: number;
    isBackupCompatible: boolean;
    whmcsEnabled: boolean;
    isAdding: boolean;
    setOs: (v: string) => void;
    setControlPanel: (v: string) => void;
    onToggleAcronis: () => void;
    setAcronisGb: (v: number) => void;
    setWhmcsEnabled: (v: boolean) => void;
    onBack: () => void;
    onProceedToCart: () => void;
    computedTotal: () => string;
}

const VpsStep2Config: React.FC<Props> = ({
    selectedPlan,
    step2Title,
    step2Specs,
    step2Tenure,
    os,
    controlPanel,
    acronisEnabled,
    acronisGb,
    acronisPricePerGb,
    backupPlanLoading,
    minStorageSize,
    maxStorageSize,
    isBackupCompatible,
    whmcsEnabled,
    isAdding,
    setOs,
    setControlPanel,
    onToggleAcronis,
    setAcronisGb,
    setWhmcsEnabled,
    onBack,
    onProceedToCart,
    computedTotal,
}) => {
    const osOptions =
        selectedPlan.vendorDetails?.supported_os
            ?.filter(o => !o.is_discontinued)
            ?.map(o => ({ label: o.os_display_name, value: o.os_name })) ?? [];

    const controlPanelOptions = useMemo(() => {
        const currentOs = selectedPlan.vendorDetails?.supported_os?.find(o => o.os_name === os);
        const cpAddons = (currentOs?.addons ?? []).filter(a => a.group_name === 'control_panel');
        const options: { label: string; value: string }[] = [{ label: 'None', value: 'none' }];
        cpAddons.forEach(a => {
            const price = selectedPlan.addons?.[a.addon_name];
            const label =
                formatControlPanelLabel(a.addon_name) + (price != null ? ` (₹${price}/mo)` : '');
            options.push({ label, value: a.addon_name });
        });
        return options;
    }, [selectedPlan, os]);

    // Vendor offers no control panel for this OS — hide the field instead of showing only "None"
    const hasControlPanelOptions = controlPanelOptions.length > 1;

    const totalPrice = Number(computedTotal()).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return (
        <div>
            <div className="border border-gray-200 rounded-xl py-7 px-8">
                <div className="text-center mb-6">
                    <Title level={3} style={{ margin: '0 0 6px', fontWeight: 700 }}>
                        {step2Title}
                    </Title>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>{step2Specs}</Text>
                </div>
                <Row>
                    <Col
                        xs={24}
                        md={hasControlPanelOptions ? 12 : 24}
                        style={{ paddingRight: hasControlPanelOptions ? 32 : 0, paddingBottom: 24 }}
                    >
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
                            style={{ width: '100%', marginBottom: 8 }}
                        />
                        <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
                            Choose the operating system for your VPS that you want pre-installed on
                            your server.
                        </Text>
                    </Col>
                    {hasControlPanelOptions && (
                        <Col
                            xs={24}
                            md={12}
                            className="border-l border-l-gray-200"
                            style={{
                                paddingLeft: 32,
                                paddingBottom: 24,
                            }}
                        >
                            <p
                                className="text-gray-900 mb-2 font-semibold"
                                style={{ fontSize: 14 }}
                            >
                                Control Panel
                            </p>
                            <Select
                                options={controlPanelOptions}
                                value={controlPanel}
                                onChange={setControlPanel}
                                style={{ width: '100%', marginBottom: 8 }}
                            />
                            <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
                                You can install a Control Panel on your VPS for easy server Management.
                            </Text>
                        </Col>
                    )}
                </Row>

                {/* {(backupPlanLoading || (acronisPricePerGb ?? 0) > 0) && (
                <Row>
                    <Col xs={24} md={12} style={{ paddingRight: 32, paddingBottom: 24 }}>
                        <Flex align="center" gap={8} style={{ marginBottom: 6 }}>
                            {backupPlanLoading ? (
                                <Skeleton.Input active size="small" style={{ width: 240 }} />
                            ) : (
                                <Text strong style={{ fontSize: 14 }}>
                                    Acronis Cyber Backup (₹{acronisPricePerGb ?? 0}/GB/mo)
                                </Text>
                            )}
                            <Tag
                                color="error"
                                style={{ margin: 0, fontSize: 11, lineHeight: '18px' }}
                            >
                                New
                            </Tag>
                        </Flex>
                        {!backupPlanLoading && !isBackupCompatible && (
                            <Alert
                                type="warning"
                                showIcon
                                message="Acronis Cyber Backup is not compatible with this VPS plan"
                                style={{ marginBottom: 10, fontSize: 12 }}
                            />
                        )}
                        <Text
                            style={{
                                color: '#374151',
                                fontSize: 13,
                                lineHeight: '1.7',
                                display: 'block',
                                marginBottom: 10,
                            }}
                        >
                            Securely backup your server data on the cloud with Acronis Cyber
                            Backups. One click setup and simple management.
                        </Text>
                        <div
                            className="border border-gray-300"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: 8,
                                overflow: 'hidden',
                                marginBottom: 8,
                            }}
                        >
                            <InputNumber
                                variant="borderless"
                                min={minStorageSize}
                                max={maxStorageSize}
                                value={acronisGb}
                                onChange={val => {
                                    if (val) setAcronisGb(val);
                                }}
                                style={{ flex: 1, minWidth: 0 }}
                                disabled={!acronisEnabled || !isBackupCompatible}
                            />
                            <span
                                className="text-gray-500"
                                style={{
                                    padding: '0 6px',
                                    fontSize: 14,
                                    userSelect: 'none',
                                }}
                            >
                                GB
                            </span>
                            <button
                                type="button"
                                onClick={onToggleAcronis}
                                disabled={!isBackupCompatible}
                                className={`border-l border-l-gray-300 ${isBackupCompatible ? 'text-lightRed' : 'text-gray-400'}`}
                                style={{
                                    background: 'none',
                                    padding: '8px 18px',
                                    cursor: isBackupCompatible ? 'pointer' : 'not-allowed',
                                    fontWeight: 500,
                                    fontSize: 14,
                                }}
                            >
                                {acronisEnabled ? 'Remove' : 'Add'}
                            </button>
                        </div>
                        <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
                            We recommend purchasing backup space which is atleast 2x of your service
                            disk space.
                        </Text>
                    </Col>
                </Row>
                )} */}

                <div>
                    <Title level={5} style={{ marginBottom: 18 }}>
                        Add-ons
                    </Title>
                    <ConfigProvider theme={{ token: { colorPrimary: '#FF4F4F' } }}>
                        <Flex vertical>
                            <Flex gap={12} align="flex-start">
                                <Checkbox
                                    checked={whmcsEnabled}
                                    onChange={e => setWhmcsEnabled(e.target.checked)}
                                    style={{ marginTop: 2 }}
                                />
                                <Text style={{ fontSize: 15 }}>
                                    WHMCS (₹ {(selectedPlan.addons?.whmcs ?? 0).toFixed(2)}/mo)
                                </Text>
                            </Flex>
                            <Text style={{ color: '#4B5563', fontSize: 13, marginLeft: 28 }}>
                                You can also choose more add-ons to get the most out of your VPS.
                            </Text>
                        </Flex>
                    </ConfigProvider>
                </div>
                <Flex
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap={16}
                    className="bg-slate-50"
                    style={{
                        borderRadius: 8,
                        padding: '16px 20px',
                        marginTop: 8,
                    }}
                >
                    <Button
                        size="large"
                        onClick={onBack}
                        style={{ minWidth: 100, borderRadius: 8 }}
                    >
                        Back
                    </Button>
                    <Flex align="center" gap={24} wrap="wrap">
                        <div className="text-right">
                            <Text strong style={{ fontSize: 16 }}>
                                Total : ₹ {totalPrice}
                            </Text>
                            <Text style={{ color: '#6B7280', fontSize: 12, display: 'block' }}>
                                (for {step2Tenure} months)
                            </Text>
                        </div>
                        <Button
                            size="large"
                            className="bg-lightRed border-lightRed text-white"
                            style={{
                                minWidth: 160,
                                borderRadius: 8,
                                fontWeight: 500,
                            }}
                            loading={isAdding}
                            onClick={onProceedToCart}
                        >
                            Proceed to Cart
                        </Button>
                    </Flex>
                </Flex>
            </div>
        </div>
    );
};

export default VpsStep2Config;
