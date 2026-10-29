import { useState } from 'react';

import { Button, Card, Flex, Form } from 'antd';
import { Formik } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    CommissionFields,
    CommissionFormValues,
    commissionSchema,
} from './ConfigureCommissionDrawer';
import SummaryStrip from './SummaryStrip';
import TabHeader from './TabHeader';
import useCommissionModes from '../../hooks/useCommissionModes';
import { AccountingService } from '../../types/services';
import { formatCommissionLabel, toAmountField } from '../../utils/commission';
import { COMMISSION_MODE_OPTIONS } from '../../utils/serviceDetailData';
import ConfiguredIcon from '../common/ConfiguredIcon';

const toFormValues = (service: AccountingService): CommissionFormValues => ({
    commissionMode: service.commissionMode ?? 'MARGIN',
    commissionType: service.commissionType ?? 'PERCENTAGE',
    providerCommission: toAmountField(service.providerCommission),
    fixedCommissionPerTransaction: toAmountField(service.fixedCommissionPerTransaction),
    isCommissionInclGST: service.isCommissionInclGST ?? false,
});

export type CommissionTabProps = {
    service: AccountingService;
    onSave: (values: {
        commissionMode: string;
        commissionType: string;
        providerCommission: number;
        fixedCommissionPerTransaction: number;
        isCommissionInclGST: boolean;
    }) => Promise<boolean>;
    onToggleConfigured: () => Promise<boolean>;
};

const CommissionTab = ({ service, onSave, onToggleConfigured }: CommissionTabProps) => {
    const dispatch = useAppDispatch();
    const [values, setValues] = useState<CommissionFormValues>(() => toFormValues(service));
    const { options: modeOptions, isLoading: modesLoading } = useCommissionModes(service.accessKey);

    const currentRate = service.commissionType
        ? formatCommissionLabel({
              commissionType: values.commissionType,
              providerCommission: Number(values.providerCommission) || 0,
              fixedCommissionPerTransaction: Number(values.fixedCommissionPerTransaction) || 0,
          })
        : null;
    const modeLabel =
        COMMISSION_MODE_OPTIONS.find(option => option.value === values.commissionMode)?.label ??
        '—';

    const handleToggleConfigured = async () => {
        const next = !service.commissionConfigured;
        const success = await onToggleConfigured();
        dispatch(
            showToast({
                description: success
                    ? `Commission marked as ${next ? 'configured' : 'not configured'} for ${service.serviceProvider}`
                    : 'Failed to update commission status. Please try again.',
                variant: success ? 'success' : 'error',
            })
        );
    };

    return (
        <Formik
            initialValues={values}
            validationSchema={commissionSchema}
            enableReinitialize
            onSubmit={async submitted => {
                const success = await onSave({
                    commissionMode: submitted.commissionMode,
                    commissionType: submitted.commissionType,
                    providerCommission: Number(submitted.providerCommission) || 0,
                    fixedCommissionPerTransaction:
                        Number(submitted.fixedCommissionPerTransaction) || 0,
                    isCommissionInclGST: submitted.isCommissionInclGST,
                });
                if (success) {
                    setValues(submitted);
                    dispatch(
                        showToast({
                            description: `Commission saved for ${service.serviceProvider}`,
                            variant: 'success',
                        })
                    );
                } else {
                    dispatch(
                        showToast({
                            description: 'Failed to save commission. Please try again.',
                            variant: 'error',
                        })
                    );
                }
            }}
        >
            {formik => (
                <Form
                    layout="vertical"
                    onFinish={() => formik.handleSubmit()}
                    className="max-w-[820px]"
                >
                    <TabHeader
                        title="Commission"
                        description={`Commission Peko earns on every ${service.serviceProvider} order.`}
                        action={
                            <Button type="primary" htmlType="submit" loading={formik.isSubmitting}>
                                Save changes
                            </Button>
                        }
                    />
                    <SummaryStrip
                        items={[
                            {
                                label: 'Current Rate',
                                value: currentRate ?? 'Not configured',
                                tone: currentRate ? 'default' : 'warning',
                            },
                            { label: 'Mode', value: modeLabel },
                            {
                                label: 'GST',
                                value: values.isCommissionInclGST ? 'Included' : 'Excluded',
                            },
                            {
                                label: 'Configured',
                                value: (
                                    <ConfiguredIcon
                                        configured={service.commissionConfigured}
                                        onToggle={handleToggleConfigured}
                                    />
                                ),
                            },
                        ]}
                    />
                    <Card className="mt-4 rounded-xl border border-borderCard shadow-none">
                        <Flex vertical className="max-w-[480px]">
                            <CommissionFields
                                modeOptions={modeOptions}
                                modesLoading={modesLoading}
                            />
                        </Flex>
                    </Card>
                </Form>
            )}
        </Formik>
    );
};

export default CommissionTab;
