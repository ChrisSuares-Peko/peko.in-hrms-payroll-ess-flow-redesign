import React, { useEffect } from 'react';

import { Col, Row } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import NewPurchaseOrderForm, { getInitialValues, LineItem, PrefillState } from './NewPurchaseOrderForm';
import POTipsPanel from './POTipsPanel';
import { usePurchaseOrder } from '../../hooks/usePurchaseOrder';
import { useVendor } from '../../hooks/useVendor';

const NewPurchaseOrder: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const prefill = (location.state ?? {}) as PrefillState;

    const { create, updateStatus, isSubmitting } = usePurchaseOrder();
    const [isIssuingPO, setIsIssuingPO] = React.useState(false);
    const { vendors, fetchVendorsWithoutPagination } = useVendor();

    useEffect(() => { fetchVendorsWithoutPagination(); }, [fetchVendorsWithoutPagination]);

    const handleCancel = () =>
        navigate(`${paths.dashboard.procure}/${paths.procure.purchaseOrders.index}`);

    const buildPayload = (values: ReturnType<typeof getInitialValues>, items: LineItem[]) => ({
        vendorId: Number(values.vendor),
        title: values.title || undefined,
        proposalId: prefill.proposalId ?? null,
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
        const result = await create(buildPayload(values, items));
        if (result) navigate(`${paths.dashboard.procure}/${paths.procure.purchaseOrders.index}`, { state: { created: true } });
    };

    const onIssuePO = async (values: ReturnType<typeof getInitialValues>, items: LineItem[]) => {
        setIsIssuingPO(true);
        const result = await create(buildPayload(values, items));
        if (result) {
            await updateStatus(result.id, 'send');
            navigate(`${paths.dashboard.procure}/${paths.procure.purchaseOrders.index}`, { state: { created: true } });
        }
        setIsIssuingPO(false);
    };

    return (
        <Row gutter={24}>
            <Col xs={24} lg={16}>
                <NewPurchaseOrderForm
                    vendors={vendors.filter(v => v.status === 'Active')}
                    isSubmitting={isSubmitting}
                    isIssuingPO={isIssuingPO}
                    prefill={prefill}
                    onSubmit={onSubmit}
                    onIssuePO={onIssuePO}
                    onCancel={handleCancel}
                />
            </Col>
            <Col xs={24} lg={8}>
                <POTipsPanel />
            </Col>
        </Row>
    );
};

export default NewPurchaseOrder;
