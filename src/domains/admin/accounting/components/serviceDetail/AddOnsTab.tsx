import { useState } from 'react';

import { Button, Typography } from 'antd';

import GenericTable, { GenericColumns } from '@components/atomic/GenericTable';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import ConfigureCommissionDrawer, { CommissionFormValues } from './ConfigureCommissionDrawer';
import {
    NotConfigured,
    PlanPrice,
    commissionLabel,
    commissionModeLabel,
    gstCell,
    toFormValues,
} from './planCells';
import TabHeader from './TabHeader';
import useAccountingServiceAddOns from '../../hooks/useAccountingServiceAddOns';
import { AccountingService, ServiceAddOn } from '../../types/services';
import ConfiguredIcon from '../common/ConfiguredIcon';

type AddOnsTabProps = {
    service: AccountingService;
    onConfigurationChange?: () => void;
};

const AddOnsTab = ({ service, onConfigurationChange }: AddOnsTabProps) => {
    const dispatch = useAppDispatch();
    const { isLoading, addOns, updateAddOn, toggleAddOnCommissionConfigured } =
        useAccountingServiceAddOns(service.accessKey);
    const [editing, setEditing] = useState<ServiceAddOn | null>(null);

    const saveAddOn = async (addOn: ServiceAddOn, values: CommissionFormValues) => {
        const success = await updateAddOn(addOn.addOnType, {
            price: Number(values.price),
            commissionMode: values.commissionMode,
            commissionType: values.commissionType,
            providerCommission: Number(values.providerCommission) || 0,
            fixedCommissionPerTransaction: Number(values.fixedCommissionPerTransaction) || 0,
            isCommissionInclGST: values.isCommissionInclGST,
        });
        dispatch(
            showToast({
                description: success
                    ? `${addOn.planName} saved`
                    : 'Failed to save the add-on. Please try again.',
                variant: success ? 'success' : 'error',
            })
        );
        if (success) {
            setEditing(null);
            onConfigurationChange?.();
        }
    };

    const handleToggleCommissionConfigured = async (addOn: ServiceAddOn) => {
        const next = !addOn.commissionConfigured;
        const success = await toggleAddOnCommissionConfigured(addOn);
        dispatch(
            showToast({
                description: success
                    ? `Commission marked as ${next ? 'configured' : 'not configured'} for ${addOn.planName}`
                    : 'Failed to update commission status. Please try again.',
                variant: success ? 'success' : 'error',
            })
        );
        if (success) onConfigurationChange?.();
    };

    const columns: GenericColumns<ServiceAddOn> = [
        {
            title: 'Add-on',
            dataIndex: 'planName',
            key: 'planName',
            width: 280,
            render: value => <Typography.Text className="font-medium">{value}</Typography.Text>,
        },
        {
            title: 'Monthly Price',
            key: 'monthlyPrice',
            render: (_, addOn) =>
                addOn.monthlyPrice == null ? (
                    '—'
                ) : (
                    <PlanPrice
                        price={addOn.monthlyPrice}
                        markup={addOn.priceMarkup?.monthlyPrice}
                    />
                ),
        },
        {
            title: 'Annual Price',
            key: 'annualPrice',
            render: (_, addOn) =>
                addOn.annualPrice == null ? (
                    '—'
                ) : (
                    <PlanPrice price={addOn.annualPrice} markup={addOn.priceMarkup?.annualPrice} />
                ),
        },
        {
            title: 'Commission Mode',
            key: 'commissionMode',
            render: (_, addOn) => commissionModeLabel(addOn) ?? <NotConfigured />,
        },
        {
            title: 'Commission',
            key: 'commission',
            render: (_, addOn) => commissionLabel(addOn) ?? <NotConfigured />,
        },
        {
            title: 'GST',
            key: 'gst',
            render: (_, addOn) => gstCell(addOn),
        },
        {
            title: 'Commission Configured',
            key: 'commissionConfigured',
            align: 'center',
            render: (_, addOn) => (
                <ConfiguredIcon
                    configured={addOn.commissionConfigured}
                    onToggle={() => handleToggleCommissionConfigured(addOn)}
                />
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 140,
            neverFold: true,
            render: (_, addOn) => <Button onClick={() => setEditing(addOn)}>Configure</Button>,
        },
    ];

    return (
        <>
            <TabHeader
                title="Add-ons"
                description={`Configure the price and the commission Peko earns on each add-on of ${service.serviceProvider}. The annual price is twelve months of the monthly price.`}
            />
            <GenericTable
                rowKey="addOnType"
                columns={columns}
                dataSource={addOns}
                loading={isLoading}
                pagination={false}
                className="rounded-xl border border-solid border-borderCard overflow-hidden"
            />
            {editing && (
                <ConfigureCommissionDrawer
                    open
                    serviceKey={service.accessKey}
                    title={`Configure add-on — ${editing.planName}`}
                    initialValues={toFormValues(editing)}
                    priceField="editable"
                    priceLabel="Monthly Price"
                    onCancel={() => setEditing(null)}
                    onSubmit={values => saveAddOn(editing, values)}
                />
            )}
        </>
    );
};

export default AddOnsTab;
