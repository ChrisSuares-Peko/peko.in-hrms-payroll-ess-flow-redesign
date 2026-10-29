import React, { useCallback, useEffect, useState } from 'react';

import { DownOutlined, FileTextOutlined, UpOutlined } from '@ant-design/icons';
import { Card, Flex, Spin, Typography } from 'antd';

import esignInitated from '../../assets/icons/esignInitated.svg';
import poCreated from '../../assets/icons/poCreated.svg';
import poToVendor from '../../assets/icons/poToVendor.svg';
import proposalRecieved from '../../assets/icons/proposalRecieved.svg';
import purchaseRaised from '../../assets/icons/purchaseRaised.svg';
import rfqRaised from '../../assets/icons/rfqRaised.svg';
import vendorPayoutTrigg from '../../assets/icons/vendorPayoutTrigg.svg';

const { Text } = Typography;

const STEP_CONFIG: Record<string, { icon: string; iconBg: string }> = {
    pr_raised:         { icon: purchaseRaised,    iconBg: '#f6ffed' },
    rfq_raised:        { icon: rfqRaised,         iconBg: '#e6f4ff' },
    proposal_received: { icon: proposalRecieved,  iconBg: '#f9f0ff' },
    po_created:        { icon: poCreated,         iconBg: '#fff7e6' },
    po_sent:           { icon: poToVendor,        iconBg: '#e6fffb' },
    esign_initiated:   { icon: esignInitated,     iconBg: '#f6ffed' },
    vendor_payout:     { icon: vendorPayoutTrigg, iconBg: '#fff7e6' },
};

const DEFAULT_CONFIG = { icon: poCreated, iconBg: '#f5f5f5' };

const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const formatKey = (k: string): string =>
    k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());

const formatValue = (k: string, v: any): string => {
    const str = String(v);
    if (str.includes('T') && str.includes('Z')) return formatDate(str);
    if ((k === 'estimatedBudget' || k === 'totalAmount') && !Number.isNaN(Number(v)))
        return `₹ ${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return str;
};

type Props = {
    poId: number;
    fetchJourney: (id: number) => Promise<any[]>;
};

const JourneyTab: React.FC<Props> = ({ poId, fetchJourney }) => {
    const [steps, setSteps]           = useState<any[]>([]);
    const [expanded, setExpanded]     = useState<string>('');
    const [isFetching, setIsFetching] = useState(false);

    const loadJourney = useCallback(async () => {
        setIsFetching(true);
        const data = await fetchJourney(poId);
        setSteps(data);
        if (data.length > 0) setExpanded(data[0].key);
        setIsFetching(false);
    }, [fetchJourney, poId]);

    useEffect(() => { loadJourney(); }, [loadJourney]);

    return (
        <Card
            style={{ borderRadius: 22, border: '0.37px solid #eaeaea', overflow: 'hidden' }}
            styles={{ body: { padding: 0 } }}
        >
            {/* Section header */}
            <Flex
                align="center"
                gap={12}
                style={{ padding: '13px 17px', borderBottom: '0.37px solid #eaeaea' }}
            >
                <Flex
                    align="center"
                    justify="center"
                    style={{ width: 37, height: 37, background: '#fff4f4', borderRadius: 10, flexShrink: 0 }}
                >
                    <FileTextOutlined style={{ color: '#FF4F4F', fontSize: 16 }} />
                </Flex>
                <Text style={{ fontWeight: 500, fontSize: 14, color: '#000' }}>Order history</Text>
            </Flex>

            <div style={{ padding: '16px 20px' }}>
                {isFetching && <Flex justify="center" style={{ padding: 20 }}><Spin /></Flex>}
                {!isFetching && steps.length === 0 && (
                    <Text style={{ fontSize: 14, color: '#676767' }}>No history events yet.</Text>
                )}
                {!isFetching && steps.length > 0 && (
                    <div style={{ position: 'relative' }}>
                        {/* Vertical dashed line */}
                        <div style={{
                            position: 'absolute',
                            left: 11,
                            top: 28,
                            bottom: 28,
                            borderLeft: '1.5px dashed #d9d9d9',
                            zIndex: 0,
                        }} />

                        <Flex vertical gap={0}>
                            {steps.map((step, idx) => {
                                const cfg     = STEP_CONFIG[step.key] ?? DEFAULT_CONFIG;
                                const details = step.details ? Object.entries(step.details).filter(([k]) => k !== 'currency' && k !== 'recordId') : [];
                                const isOpen  = expanded === step.key;

                                return (
                                    <div key={step.key}>
                                        <Flex
                                            justify="space-between"
                                            align="flex-start"
                                            style={{ padding: '12px 0', cursor: 'pointer', position: 'relative', zIndex: 1 }}
                                            onClick={() => setExpanded(prev => prev === step.key ? '' : step.key)}
                                        >
                                            <Flex gap={10} align="flex-start">
                                                <Flex
                                                    align="center"
                                                    justify="center"
                                                    style={{ width: 24, height: 24, borderRadius: 6, background: cfg.iconBg, flexShrink: 0 }}
                                                >
                                                    <img src={cfg.icon} alt={step.title} style={{ width: 14, height: 14 }} />
                                                </Flex>
                                                <Flex vertical gap={6}>
                                                    <Text style={{ fontSize: 16, fontWeight: 500, color: '#000' }}>{step.title}</Text>
                                                    {step.description && (
                                                        <Text style={{ fontSize: 14, color: '#676767' }}>{step.description}</Text>
                                                    )}
                                                    <Text style={{ fontSize: 13, color: '#a3a3a3' }}>{formatDate(step.date)}</Text>
                                                </Flex>
                                            </Flex>
                                            {details.length > 0 && (
                                                isOpen
                                                    ? <UpOutlined style={{ fontSize: 14, color: '#676767', marginTop: 4 }} />
                                                    : <DownOutlined style={{ fontSize: 14, color: '#676767', marginTop: 4 }} />
                                            )}
                                        </Flex>

                                        {isOpen && details.length > 0 && (
                                            <div style={{ paddingLeft: 34, paddingBottom: 12 }}>
                                                <Card
                                                    style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12 }}
                                                    styles={{ body: { padding: 20 } }}
                                                >
                                                    <Flex vertical gap={13}>
                                                        {details.map(([k, v]: [string, any]) => (
                                                            <Flex key={k} justify="space-between" align="center">
                                                                <Text style={{ fontSize: 14, color: '#969696', letterSpacing: '0.42px' }}>
                                                                    {formatKey(k)}:
                                                                </Text>
                                                                <Text style={{ fontSize: 15, fontWeight: 500, color: '#070707' }}>
                                                                    {formatValue(k, v)}
                                                                </Text>
                                                            </Flex>
                                                        ))}
                                                    </Flex>
                                                </Card>
                                            </div>
                                        )}

                                        {idx < steps.length - 1 && (
                                            <div style={{ height: 1, background: '#eaeaea', marginLeft: 34 }} />
                                        )}
                                    </div>
                                );
                            })}
                        </Flex>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default JourneyTab;
