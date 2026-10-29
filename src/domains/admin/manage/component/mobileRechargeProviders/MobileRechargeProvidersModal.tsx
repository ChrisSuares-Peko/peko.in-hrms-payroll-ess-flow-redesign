import { Flex, Form } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { ACCOUNTING_PORTAL_ONLY } from '../../../utils/commissionValidation';
import useMobileRechargeProviders from '../../hooks/useMobileRechargeProviders';
import mobileRechargeProviderSchema from '../../schema/mobileRechargeProviderSchema';
import {
    commissionModeOptions,
    commissionTypeOptions,
    MobileRechargeProviderData,
} from '../../types/mobileRechargeProviderTypes';

type MobileRechargeProvidersModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: MobileRechargeProviderData;
    setRefresh: (e: any) => void;
};

const MobileRechargeProvidersModal = ({
    open,
    handleCancel,
    data,
    setRefresh,
}: MobileRechargeProvidersModalProps) => {
    const dispatch = useAppDispatch();
    const { createProvider, isLoading, updateProvider } = useMobileRechargeProviders({});

    const handleFormSubmit = async (values: any) => {
        const payload = {
            ...values,
            fixedCommissionPerTransaction:
                values.fixedCommissionPerTransaction === ''
                    ? null
                    : values.fixedCommissionPerTransaction,
        };

        let res: any;
        try {
            if (data) {
                res = await updateProvider({ ...payload, id: data.id });
            } else {
                res = await createProvider(payload);
            }
            if (res?.status === true) {
                dispatch(
                    showToast({
                        description: `${res.message}`,
                        variant: 'success',
                    })
                );
            } else {
                dispatch(
                    showToast({
                        description: `${res?.message}`,
                        variant: 'error',
                    })
                );
            }
        } catch (error) {
            dispatch(
                showToast({
                    description: 'An error occurred while saving the provider.',
                    variant: 'error',
                })
            );
        } finally {
            handleCancel();
            setRefresh(true); // Ensure that handleCancel is called after the async operation
        }
    };

    return (
        <CustomModalWithForm
            isLoading={isLoading}
            modalTitle={data ? 'Edit Mobile Recharge Provider' : 'Add Mobile Recharge Provider'}
            open={open}
            validationSchema={mobileRechargeProviderSchema}
            handleCancel={handleCancel}
            handleFormSubmit={handleFormSubmit}
            initialValues={{
                providerName: data?.providerName || '',
                displayName: data?.displayName || '',
                commissionMode: data?.commissionMode || 'MARGIN',
                commissionType: data?.commissionType || 'PERCENTAGE',
                commission: data?.commission ?? 0,
                fixedCommissionPerTransaction: data?.fixedCommissionPerTransaction ?? 0,
                isCommissionInclGST: data?.isCommissionInclGST ?? true,
            }}
        >
            <Flex vertical className="w-full">
                <Form layout="vertical">
                    <TextInput
                        name="displayName"
                        label="Display Name"
                        type="text"
                        placeholder="Enter display name"
                        isRequired
                        maxLength={100}
                    />
                    <TextInput
                        name="providerName"
                        label="Provider Name"
                        type="text"
                        placeholder="Enter provider name"
                        isRequired
                        maxLength={100}
                    />
                    <SelectInput
                        name="commissionMode"
                        label="Commission Mode"
                        placeholder="Please select commission mode"
                        options={commissionModeOptions}
                        isRequired
                        isDisabled
                        showToolTip
                        tooltipText={ACCOUNTING_PORTAL_ONLY}
                    />
                    <SelectInput
                        name="commissionType"
                        label="Commission Type"
                        placeholder="Please select commission type"
                        options={commissionTypeOptions}
                        isRequired
                        isDisabled
                        showToolTip
                        tooltipText={ACCOUNTING_PORTAL_ONLY}
                    />
                    <TextInput
                        name="commission"
                        label="Commission"
                        type="text"
                        placeholder="Enter Commission"
                        isRequired
                        classes="rounded-sm"
                        allowTwoDecimalsOnly
                        isDisabled
                        showToolTip
                        tooltipText={ACCOUNTING_PORTAL_ONLY}
                    />
                    <TextInput
                        name="fixedCommissionPerTransaction"
                        label="Fixed Commission Per Transaction"
                        type="text"
                        placeholder="Enter Fixed Commission Per Transaction"
                        classes="rounded-sm"
                        allowTwoDecimalsOnly
                        isDisabled
                        showToolTip
                        tooltipText={ACCOUNTING_PORTAL_ONLY}
                    />
                    <SwitchInput
                        name="isCommissionInclGST"
                        label="Commission Includes GST"
                        isDisabled
                        showToolTip
                        tooltipText={ACCOUNTING_PORTAL_ONLY}
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default MobileRechargeProvidersModal;
