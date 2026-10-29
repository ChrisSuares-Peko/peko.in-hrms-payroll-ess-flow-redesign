import React, { useEffect, useMemo, useState } from 'react';

import {
    Alert,
    Button,
    Card,
    Col,
    Flex,
    Modal,
    Row,
    Select,
    Skeleton,
    Space,
    Steps,
    Typography,
} from 'antd';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import CashbackSyncSection from './CashbackSyncSection';
import { MappingRow, PEKO_LABEL, autoMap } from './helpers';
import PackageMappingSection from './PackageMappingSection';
import useCopyCashback from '../../hooks/useCopyCashback';
import usePartnersForCorporate from '../../hooks/usePartnersForCorporate';
import { CopyPackage } from '../../types/cashbackCopy';

type Props = {
    open: boolean;
    handleCancel: () => void;
    setRefresh?: React.Dispatch<React.SetStateAction<boolean>>;
};

const CashbackCopyModal = ({ open, handleCancel, setRefresh }: Props) => {
    const dispatch = useAppDispatch();
    const { partnerData } = usePartnersForCorporate('');
    const { isLoading, compareData, setCompareData, fetchCompareData } = useCopyCashback();

    const [step, setStep] = useState(0);
    const [fromPartnerId, setFromPartnerId] = useState<string | undefined>();
    const [toPartnerId, setToPartnerId] = useState<string | undefined>();
    const [mappings, setMappings] = useState<MappingRow[]>([]);

    const partnerOptions = useMemo(() => {
        if (!partnerData) return [];
        return partnerData.map(p =>
            p.value === 'default' ? { value: 'default', label: PEKO_LABEL } : p
        );
    }, [partnerData]);

    useEffect(() => {
        setMappings([]);
        setCompareData(undefined);
        setStep(0);
    }, [fromPartnerId, toPartnerId, setCompareData]);

    const partnerLabel = (id?: string) => {
        if (!id) return '';
        if (id === 'default') return PEKO_LABEL;
        return partnerOptions.find(p => String(p.value) === String(id))?.label ?? id;
    };

    const fromPartnerLabel = partnerLabel(fromPartnerId);
    const toPartnerLabel = partnerLabel(toPartnerId);

    const mappedPairsCount = mappings.filter(m => m.toId != null).length;

    const canGoStep1 = !!fromPartnerId && !!toPartnerId && fromPartnerId !== toPartnerId;
    const canGoStep2 = mappedPairsCount > 0;

    const handleContinueClick = async () => {
        if (step === 0) {
            if (!fromPartnerId || !toPartnerId || fromPartnerId === toPartnerId) return;
            const data = await fetchCompareData(fromPartnerId, toPartnerId);
            if (data) {
                if (!data.from.packages?.length) {
                    dispatch(
                        showToast({
                            description:
                                'No packages are available for the selected source partner.',
                            variant: 'warning',
                        })
                    );
                    return;
                }
                setMappings(autoMap(data.from.packages, data.to.packages));
                setStep(1);
            }
            return;
        }
        setStep(s => s + 1);
    };

    const handlePackageCreated = (newPkg: CopyPackage, forFromId: number) => {
        if (!compareData) return;
        setCompareData({
            ...compareData,
            to: { ...compareData.to, packages: [...compareData.to.packages, newPkg] },
        });
        setMappings(prev =>
            prev.map(m => (m.fromId === forFromId ? { ...m, toId: newPkg.id, isAuto: false } : m))
        );
        setRefresh?.(true);
    };

    const renderPartnersStep = () => (
        <Card className="!mb-4">
            <Typography.Text type="secondary" className="text-xs uppercase tracking-wide">
                Step 1 · Choose partners
            </Typography.Text>
            <Row gutter={[16, 16]} className="mt-2">
                <Col xs={24} sm={12}>
                    <Typography.Text strong>From Partner</Typography.Text>
                    <Select
                        className="w-full mt-1"
                        placeholder="Select source partner"
                        options={partnerOptions}
                        value={fromPartnerId}
                        onChange={value => setFromPartnerId(value)}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '')
                                .toString()
                                .toLowerCase()
                                .includes(input.toLowerCase())
                        }
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <Typography.Text strong>To Partner</Typography.Text>
                    <Select
                        className="w-full mt-1"
                        placeholder="Select destination partner"
                        options={partnerOptions}
                        value={toPartnerId}
                        onChange={value => setToPartnerId(value)}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '')
                                .toString()
                                .toLowerCase()
                                .includes(input.toLowerCase())
                        }
                    />
                </Col>
            </Row>
            {fromPartnerId && toPartnerId && fromPartnerId === toPartnerId && (
                <Alert
                    className="mt-3"
                    type="error"
                    showIcon
                    message="Source and destination partners must be different"
                />
            )}
        </Card>
    );

    return (
        <Modal
            open={open}
            onCancel={handleCancel}
            width={1200}
            centered
            title="Clone Packages &amp; Cashbacks"
            footer={[
                <Flex key="footer" justify="space-between" align="center">
                    <div>
                        {step > 0 && (
                            <Button onClick={() => setStep(s => Math.max(s - 1, 0))}>Back</Button>
                        )}
                    </div>
                    <Space>
                        <Button onClick={handleCancel}>Close</Button>
                        {step < 2 && (
                            <Button
                                type="primary"
                                danger
                                onClick={handleContinueClick}
                                loading={step === 0 && isLoading}
                                disabled={step === 0 ? !canGoStep1 : !canGoStep2}
                            >
                                {step === 0 ? 'Continue to Mapping' : 'Continue to Cashbacks'}
                            </Button>
                        )}
                    </Space>
                </Flex>,
            ]}
        >
            <Steps
                current={step}
                size="small"
                className="!mb-4"
                items={[
                    { title: 'Partners' },
                    { title: 'Package mapping' },
                    { title: 'Cashback sync' },
                ]}
            />

            {step === 0 && (
                <>
                    {renderPartnersStep()}
                    {isLoading && (
                        <Card>
                            <Skeleton active paragraph={{ rows: 4 }} />
                        </Card>
                    )}
                </>
            )}

            {step === 1 && compareData && (
                <>
                    {renderPartnersStep()}
                    <PackageMappingSection
                        compareData={compareData}
                        fromPartnerLabel={fromPartnerLabel}
                        toPartnerLabel={toPartnerLabel}
                        toPartnerId={toPartnerId}
                        mappings={mappings}
                        setMappings={setMappings}
                        onPackageCreated={handlePackageCreated}
                    />
                </>
            )}

            {step === 2 && compareData && (
                <CashbackSyncSection
                    compareData={compareData}
                    setCompareData={setCompareData}
                    mappings={mappings}
                    fromPartnerLabel={fromPartnerLabel}
                    toPartnerLabel={toPartnerLabel}
                    onSaved={() => setRefresh?.(true)}
                />
            )}
        </Modal>
    );
};

export default CashbackCopyModal;
