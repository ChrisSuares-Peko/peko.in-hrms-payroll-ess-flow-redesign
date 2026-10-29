import React, { useEffect, useState } from 'react';

import { Col, Flex, Row, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import NewPurchaseOrderForm, { getInitialValues, LineItem } from './NewPurchaseOrderForm';
import POTipsPanel from './POTipsPanel';
import { getRFQsAll } from '../../api';
import { usePurchaseOrder } from '../../hooks/usePurchaseOrder';
import { useVendor } from '../../hooks/useVendor';

const EditPurchaseOrder: React.FC = () => {
    const { poId } = useParams<{ poId: string }>();
    const navigate = useNavigate();

    const { detail, isLoading, isSubmitting, update, updateStatus } = usePurchaseOrder(poId);
    const [isIssuingPO, setIsIssuingPO] = useState(false);
    const { vendors, fetchVendorsWithoutPagination } = useVendor();
    const { corporateId } = useAppSelector(state => state.reducer.auth);
    const [rfqs, setRfqs] = useState<{ id: number; refNumber: string }[]>([]);
    const [rfqsLoading, setRfqsLoading] = useState(true);

    useEffect(() => { fetchVendorsWithoutPagination(); }, [fetchVendorsWithoutPagination]);
    useEffect(() => {
        getRFQsAll({ corporateId: String(corporateId) }).then(data => {
            if (data) setRfqs(data as any);
            setRfqsLoading(false);
        });
    }, [corporateId]);

    const handleCancel = () =>
        navigate(`${paths.dashboard.procure}/${paths.procure.purchaseOrders.index}/${poId}`);

    const buildPayload = (values: ReturnType<typeof getInitialValues>, items: LineItem[]) => ({
        vendorId: Number(values.vendor),
        title: values.title || undefined,
        rfqId: values.linkedRFQ ? Number(values.linkedRFQ) : null,
        purchaseRequestId: null,
        currency: values.currency,
        deliveryAddress: values.deliveryAddress,
        deliveryDate: values.deliveryDate || undefined,
        paymentTerms: values.paymentTerms || undefined,
        notesToVendor: values.notes || undefined,
        internalNotes: values.internalNotes || undefined,
        lineItems: items.map((item, index) => ({
            description: item.description,
            qty: Number(item.qty),
            unit: item.unit,
            unitPrice: parseFloat(String(item.amount)) || 0,
            taxRate: parseFloat(String(item.taxRate)) || 0,
            gstType: item.gstType || 'exclusive',
            sortOrder: index + 1,
        })),
    });

    const onSubmit = async (values: ReturnType<typeof getInitialValues>, items: LineItem[]) => {
        const result = await update(poId!, buildPayload(values, items));
        if (result) navigate(`${paths.dashboard.procure}/${paths.procure.purchaseOrders.index}/${poId}`);
    };

    const onIssuePO = async (values: ReturnType<typeof getInitialValues>, items: LineItem[]) => {
        setIsIssuingPO(true);
        const result = await update(poId!, buildPayload(values, items));
        if (result) {
            await updateStatus(poId!, 'send');
            navigate(`${paths.dashboard.procure}/${paths.procure.purchaseOrders.index}/${poId}`);
        }
        setIsIssuingPO(false);
    };

    if (isLoading || !detail || rfqsLoading) {
        return <Flex justify="center" className="p-16"><Spin /></Flex>;
    }

    const prefill = {
        title: detail.title ?? '',
        vendor: detail.vendorId ? String(detail.vendorId) : '',
        linkedRFQ: (() => {
            if ((detail as any).rfq?.id) return String((detail as any).rfq.id);
            if ((detail as any).rfqId) return String((detail as any).rfqId);
            return '';
        })(),
        currency: detail.currency,
        deliveryAddress: detail.deliveryAddress ?? '',
        deliveryDate: detail.deliveryDate ? detail.deliveryDate.split('T')[0] : '',
        paymentTerms: detail.paymentTerms ?? '',
        notes: detail.notesToVendor ?? '',
        internalNotes: detail.internalNotes ?? '',
        lineItems: (detail.lineItems ?? []).map((item: any, i: number) => ({
            key: String(i + 1),
            description: item.description ?? '',
            qty: String(Number(item.qty) || 1),
            unit: item.unit ?? 'Each',
            amount: String(Number(item.unitPrice) || 0),
            taxRate: item.taxRate != null ? String(parseInt(item.taxRate, 10)) : '0',
            gstType: item.gstType ?? 'exclusive',
        })),
    };

    return (
        <Row gutter={24}>
            <Col xs={24} lg={16}>
                <NewPurchaseOrderForm
                    vendors={vendors}
                    isSubmitting={isSubmitting}
                    isIssuingPO={isIssuingPO}
                    prefill={prefill}
                    onSubmit={onSubmit}
                    onIssuePO={onIssuePO}
                    onCancel={handleCancel}
                    title="Edit Purchase Order"
                    rfqOptions={rfqs}
                    allowPastDates
                    readOnlyLineItems
                />
            </Col>
            <Col xs={24} lg={8}>
                <POTipsPanel />
            </Col>
        </Row>
    );
};

export default EditPurchaseOrder;
