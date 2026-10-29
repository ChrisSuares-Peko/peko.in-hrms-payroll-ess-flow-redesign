import React, { useMemo, useState } from 'react';

import { Col, Row } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import NewPurchaseRequestForm, { initialValues } from './NewPurchaseRequestForm';
import PRTipsPanel from './PRTipsPanel';
import { usePurchaseRequestApi } from '../../hooks/usePurchaseRequestApi';
import { resetPurchaseRequestDraft } from '../../slices/purchaseRequestDraftSlice';

const NewPurchaseRequest: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { create, employees } = usePurchaseRequestApi(undefined, undefined, true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);

    const savedDraft = useAppSelector(state => state.reducer.purchaseRequestDraft);

    // Only restore from Redux if the user actually entered something
    const hasDraft = !!(
        savedDraft?.requestedBy ||
        savedDraft?.department ||
        savedDraft?.category ||
        savedDraft?.notes ||
        savedDraft?.lineItems?.some(i => i.itemName)
    );

    const formInitialValues = useMemo(() => {
        if (!hasDraft) return initialValues;
        return {
            ...initialValues,
            ...savedDraft,
            lineItems: savedDraft?.lineItems?.length ? savedDraft.lineItems : initialValues.lineItems,
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // compute once on mount so enableReinitialize doesn't fight auto-save

    const buildPayload = (values: typeof initialValues, status: 'Open' | 'Draft') => {
        const estimatedBudget = values.lineItems.reduce(
            (sum, i) => sum + Number(i.qty) * Number(i.estUnitCost),
            0
        );
        const description = values.lineItems.map(i => i.itemName).filter(Boolean).join(', ') || '-';
        return {
            requestedBy: values.requestedBy || undefined,
            department: values.department,
            category: values.category,
            description,
            estimatedBudget,
            currency: 'INR',
            neededBy: values.neededBy ? `${values.neededBy}T00:00:00.000Z` : undefined,
            notes: values.notes || undefined,
            attachments: values.attachments.length ? values.attachments : undefined,
            lineItems: values.lineItems.filter(i => i.itemName).map(({ key: _key, ...rest }) => rest),
            status,
        };
    };

    const handleCancel = () =>
        navigate(`${paths.dashboard.procure}/${paths.procure.purchaseRequests.index}`);

    const onSubmit = async (values: typeof initialValues) => {
        setIsSubmitting(true);
        const result = await create(buildPayload(values, 'Open') as any);
        setIsSubmitting(false);
        if (result) {
            dispatch(resetPurchaseRequestDraft());
            navigate(`${paths.dashboard.procure}/${paths.procure.purchaseRequests.index}`);
        }
    };

    const onSaveAsDraft = async (values: typeof initialValues) => {
        setIsSavingDraft(true);
        const result = await create(buildPayload(values, 'Draft') as any);
        setIsSavingDraft(false);
        if (result) {
            dispatch(resetPurchaseRequestDraft());
            navigate(`${paths.dashboard.procure}/${paths.procure.purchaseRequests.index}`);
        }
    };

    return (
        <Row gutter={24} className="p-0">
            <Col xs={24} lg={15}>
                <NewPurchaseRequestForm
                    employees={employees ?? []}
                    isSubmitting={isSubmitting}
                    isSavingDraft={isSavingDraft}
                    onSubmit={onSubmit}
                    onSaveAsDraft={onSaveAsDraft}
                    onCancel={handleCancel}
                    formInitialValues={formInitialValues}
                />
            </Col>
            <Col xs={24} lg={9}>
                <PRTipsPanel />
            </Col>
        </Row>
    );
};

export default NewPurchaseRequest;
