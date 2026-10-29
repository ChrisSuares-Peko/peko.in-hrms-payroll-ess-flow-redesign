import { useState } from 'react';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { amountBeforeCommission } from '@utils/priceFormat';

import useEsimPlanUpdate from '../../hooks/useEsimPlanUpdate';
import { esimPlanEditSchema, esimPlanSchema } from '../../schema/eSIMPlans';
import { EsimPlan } from '../../types/eSIM';
import PlanForm from '../forms/eSIMPlansForm';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: EsimPlan;
    handleRefresh: () => void;
    mode: string;
};

const CreateUpdateModal = ({
    open,
    handleCancel,
    data,
    handleRefresh,
    mode,
}: DepartmentModalProps) => {
    const [searchCountry, setSearchCountry] = useState<string>('');
    const {
        isLoading,
        handleEsimPlanCreation,
        updateEsimPlanDetails,
        coverageData,
        countryLoading,
    } = useEsimPlanUpdate(searchCountry);
    const modalTitle = mode === 'add' ? 'Add eSIM Plan' : 'Edit eSIM Plan';
    const esimValidationSchema: any = data ? esimPlanEditSchema : esimPlanSchema;
    return (
        <CustomModalWithForm
            modalTitle={modalTitle}
            open={open}
            isDisabled={countryLoading}
            isLoading={isLoading}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                let result;
                if (values.id) {
                    // Edit flow: only commission-related fields may be updated.
                    const commissionOnlyValues: EsimPlan = {
                        id: values.id,
                        commissionMode: values.commissionMode,
                        commissionType: values.commissionType,
                        commission: values.commission,
                        fixedCommissionPerTransaction: values.fixedCommissionPerTransaction,
                        isCommissionInclGST: values.isCommissionInclGST,
                    } as EsimPlan;
                    result = await updateEsimPlanDetails(commissionOnlyValues);
                } else {
                    delete values.name;
                    values.coverageId = values.coverage;
                    const found = coverageData?.find(
                        item => values.coverage === item.value || values.country === item.label
                    );
                    values.networks = found?.network;
                    values.provider = found?.provider?.toUpperCase();
                    values.country = found?.label.split(',')[0];
                    result = await handleEsimPlanCreation(values);
                }
                if (result) {
                    handleCancel();
                    handleRefresh();
                }
            }}
            initialValues={{
                id: data?.planId || '',
                name: data?.name || '',
                country: data?.country,
                coverage: data?.coverageId,
                dataMBs: data?.dataMBs || '',
                periodDays: data?.periodDays || '',
                amount: data?.amount
                    ? amountBeforeCommission(data.amount, data.totalCommission).toFixed(2)
                    : '',
                commissionMode: data?.commissionMode || 'MARGIN',
                commissionType: data?.commissionType || 'PERCENTAGE',
                commission: data?.commission || 0,
                fixedCommissionPerTransaction: data?.fixedCommissionPerTransaction || 0,
                isCommissionInclGST:
                    data?.isCommissionInclGST != null ? Boolean(data.isCommissionInclGST) : true,
            }}
            validationSchema={esimValidationSchema}
        >
            <PlanForm
                isEdit={!!data}
                coverageData={coverageData}
                setSearchCountry={setSearchCountry}
                provider={data?.provider}
            />
        </CustomModalWithForm>
    );
};

export default CreateUpdateModal;
