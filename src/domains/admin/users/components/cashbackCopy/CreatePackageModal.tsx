import React, { useEffect, useState } from 'react';

import { Alert, Button, Col, Input, InputNumber, Modal, Row, Space, Typography } from 'antd';

import { CustomerPaysRow } from '@components/atomic/PriceAfterDiscount';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { toNum } from './helpers';
import useCopyCashback from '../../hooks/useCopyCashback';
import { CopyPackage } from '../../types/cashbackCopy';

type Props = {
    open: boolean;
    source: CopyPackage | undefined;
    toPartnerId: string | undefined;
    toPartnerLabel: string;
    onCreated: (newPkg: CopyPackage) => void;
    onCancel: () => void;
};

const CreatePackageModal = ({
    open,
    source,
    toPartnerId,
    toPartnerLabel,
    onCreated,
    onCancel,
}: Props) => {
    const dispatch = useAppDispatch();
    const { clonePackageToPartner } = useCopyCashback();

    const [name, setName] = useState('');
    const [alias, setAlias] = useState('');
    const [priceMonthly, setPriceMonthly] = useState<number | null>(null);
    const [priceAnnually, setPriceAnnually] = useState<number | null>(null);
    const [discountMonthly, setDiscountMonthly] = useState<number | null>(null);
    const [discountAnnually, setDiscountAnnually] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open || !source) return;
        setName(source.packageName ?? '');
        setAlias(source.aliasName ?? '');
        setPriceMonthly(toNum(source.packagePrices?.monthly));
        setPriceAnnually(toNum(source.packagePrices?.annually));
        setDiscountMonthly(toNum(source.discount?.monthly));
        setDiscountAnnually(toNum(source.discount?.annually));
    }, [open, source]);

    const handleSubmit = async () => {
        if (!source || !toPartnerId) return;
        if (!name.trim()) {
            dispatch(showToast({ description: 'Package name is required', variant: 'error' }));
            return;
        }
        setSubmitting(true);
        const res = await clonePackageToPartner({
            fromPackageId: source.id,
            toPartnerId,
            overrides: {
                packageName: name.trim(),
                aliasName: alias.trim(),
                packagePrices: { monthly: priceMonthly, annually: priceAnnually },
                discount: {
                    monthly: discountMonthly ?? 0,
                    annually: discountAnnually ?? 0,
                },
            },
        });
        setSubmitting(false);
        if (res && (res as any).status === true) {
            const newPkg = (res as any).data as CopyPackage;
            dispatch(
                showToast({
                    description: `Package "${newPkg?.packageName}" was created and mapped successfully.`,
                    variant: 'success',
                })
            );
            onCreated(newPkg);
        } else if (res && (res as any).status === false) {
            dispatch(
                showToast({ description: (res as any).message ?? 'Failed', variant: 'error' })
            );
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            title="Create package in To partner"
            centered
            width={520}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Cancel
                </Button>,
                <Button key="ok" type="primary" danger loading={submitting} onClick={handleSubmit}>
                    Create &amp; Map
                </Button>,
            ]}
        >
            {source && (
                <>
                    <Alert
                        className="mb-3"
                        type="info"
                        showIcon
                        message={
                            <span>
                                A copy of <b>{source.packageName}</b> will be created on{' '}
                                <b>{toPartnerLabel}</b> and mapped to this row.
                            </span>
                        }
                    />
                    <Space direction="vertical" className="w-full" size="middle">
                        <div>
                            <Typography.Text strong>Package Name *</Typography.Text>
                            <Input
                                className="mt-1"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Enter package name for the To partner"
                                maxLength={200}
                            />
                        </div>
                        <div>
                            <Typography.Text strong>Alias Name</Typography.Text>
                            <Input
                                className="mt-1"
                                value={alias}
                                onChange={e => setAlias(e.target.value)}
                                placeholder="Optional alias"
                                maxLength={200}
                            />
                        </div>
                        <Row gutter={12}>
                            <Col span={12}>
                                <Typography.Text strong>Package Price (monthly)</Typography.Text>
                                <InputNumber
                                    className="w-full mt-1"
                                    value={priceMonthly ?? undefined}
                                    onChange={v =>
                                        setPriceMonthly(typeof v === 'number' ? v : null)
                                    }
                                    min={0}
                                    placeholder="Enter monthly price"
                                />
                            </Col>
                            <Col span={12}>
                                <Typography.Text strong>Package Price (annually)</Typography.Text>
                                <InputNumber
                                    className="w-full mt-1"
                                    value={priceAnnually ?? undefined}
                                    onChange={v =>
                                        setPriceAnnually(typeof v === 'number' ? v : null)
                                    }
                                    min={0}
                                    placeholder="Enter annual price"
                                />
                            </Col>
                        </Row>
                        <Row gutter={12}>
                            <Col span={12}>
                                <Typography.Text strong>Discount (monthly)</Typography.Text>
                                <InputNumber
                                    className="w-full mt-1"
                                    value={discountMonthly ?? undefined}
                                    onChange={v =>
                                        setDiscountMonthly(typeof v === 'number' ? v : null)
                                    }
                                    min={0}
                                    placeholder="0"
                                />
                            </Col>
                            <Col span={12}>
                                <Typography.Text strong>Discount (annually)</Typography.Text>
                                <InputNumber
                                    className="w-full mt-1"
                                    value={discountAnnually ?? undefined}
                                    onChange={v =>
                                        setDiscountAnnually(typeof v === 'number' ? v : null)
                                    }
                                    min={0}
                                    placeholder="0"
                                />
                            </Col>
                        </Row>
                        <Row gutter={12}>
                            <Col span={12}>
                                <CustomerPaysRow
                                    label="Customer pays (monthly)"
                                    price={priceMonthly}
                                    discount={discountMonthly}
                                    className="mb-0"
                                />
                            </Col>
                            <Col span={12}>
                                <CustomerPaysRow
                                    label="Customer pays (annually)"
                                    price={priceAnnually}
                                    discount={discountAnnually}
                                    className="mb-0"
                                />
                            </Col>
                        </Row>
                        <Typography.Text type="secondary" className="text-xs">
                            All fields are pre-filled from the source package. Edit any of them if
                            needed. Other fields (type, access code, status, etc.) are copied as-is.
                        </Typography.Text>
                    </Space>
                </>
            )}
        </Modal>
    );
};

export default CreatePackageModal;
